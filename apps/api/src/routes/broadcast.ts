import { Hono } from "hono"
import type { Context } from "hono"
import { drizzle } from "drizzle-orm/d1"
import type { InferSelectModel } from "drizzle-orm"
import { and, desc, eq, inArray } from "drizzle-orm"
import { createSelectSchema } from "drizzle-zod"
import type { ApiError } from "@workspace/api-rpc"
import { z } from "zod"
import { createAuth } from "../lib/auth"
import { sessionAuth } from "../middleware/auth"
import * as schema from "../schema"
import type { AppEnv } from "../types"
import { zodValidator } from "../lib/zod-validator"
import { extFromType } from "../lib/utils"

const MAX_CONTENT_LENGTH = 4000
const MAX_IMAGE_COUNT = 4
const IMAGE_MAX_SIZE = 8 * 1024 * 1024
const IMAGE_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

const UserSelectSchema = createSelectSchema(schema.user)
const BroadcastPostSelectSchema = createSelectSchema(schema.broadcastPost)

const BroadcastUserSchema = UserSelectSchema.pick({
  id: true,
  name: true,
  image: true,
})

const BroadcastPostSchema = BroadcastPostSelectSchema.pick({
  id: true,
  parentId: true,
  content: true,
}).extend({
  createdAt: z.string(),
  user: BroadcastUserSchema,
  images: z.array(z.string().url()),
  likeCount: z.number().int().nonnegative(),
  likedByMe: z.boolean(),
})

const GetBroadcastResponseSchema = z.object({
  posts: z.array(BroadcastPostSchema),
})

const CreateBroadcastPostBodySchema = BroadcastPostSelectSchema.pick({
  content: true,
  parentId: true,
}).extend({
  content: z.string().trim().min(1).max(MAX_CONTENT_LENGTH),
  images: z.array(z.string().trim().url()).max(MAX_IMAGE_COUNT).optional(),
})

const BroadcastPostParamsSchema = z.object({
  id: z.string().trim().min(1),
})

const ToggleLikeResponseSchema = z.object({
  success: z.literal(true),
})

const LinkPreviewQuerySchema = z.object({
  url: z.string().trim().url(),
})

const LinkPreviewSchema = z.object({
  url: z.string().url(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  image: z.string().url().nullable(),
  siteName: z.string().nullable(),
})

const LinkPreviewResponseSchema = z.object({
  preview: LinkPreviewSchema.nullable(),
})

type GetBroadcastResponse = z.infer<typeof GetBroadcastResponseSchema>
type ToggleLikeResponse = z.infer<typeof ToggleLikeResponseSchema>
type LinkPreviewResponse = z.infer<typeof LinkPreviewResponseSchema>
type BroadcastLikeModel = InferSelectModel<typeof schema.broadcastLike>
type BroadcastPostImageModel = InferSelectModel<typeof schema.broadcastPostImage>
type UserModel = InferSelectModel<typeof schema.user>
type BroadcastPostModel = InferSelectModel<typeof schema.broadcastPost>
type BroadcastUserDto = Pick<UserModel, "id" | "name" | "image">
type BroadcastPostRow = Pick<BroadcastPostModel, "id" | "parentId" | "content" | "createdAt"> & {
  user: BroadcastUserDto
}
type BroadcastImageRow = Pick<BroadcastPostImageModel, "postId" | "imageUrl" | "sortOrder">

const broadcast = new Hono<AppEnv>()

function normalizeNull(value: string | null | undefined) {
  return value ?? null
}

function matchMetaContent(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const direct = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  )
  const directMatch = html.match(direct)
  if (directMatch?.[1]) return directMatch[1].trim()

  const reverse = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
    "i",
  )
  const reverseMatch = html.match(reverse)
  if (reverseMatch?.[1]) return reverseMatch[1].trim()
  return null
}

function matchTitle(html: string) {
  const matched = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (!matched?.[1]) return null
  const title = matched[1].trim()
  return title.length > 0 ? title : null
}

function toAbsoluteUrl(value: string | null, base: string) {
  if (!value) return null
  try {
    return new URL(value, base).toString()
  } catch {
    return null
  }
}

function toBroadcastDto(
  post: BroadcastPostRow,
  imagesByPostId: Map<string, string[]>,
  likeCountMap: Map<string, number>,
  likedByMeSet: Set<string>,
) {
  return {
    id: post.id,
    parentId: post.parentId,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    user: post.user,
    images: imagesByPostId.get(post.id) ?? [],
    likeCount: likeCountMap.get(post.id) ?? 0,
    likedByMe: likedByMeSet.has(post.id),
  }
}

async function getCurrentUserId(c: Context<AppEnv>) {
  const auth = createAuth(c.env as any)
  const session = await auth.api.getSession({ headers: c.req.raw.headers }).catch(() => null)
  return session?.user.id ?? null
}

const broadcastRouter = broadcast
  .get("/", async (c) => {
    const db = drizzle(c.env.hexi_site)
    const currentUserId = await getCurrentUserId(c)

    const postRows = await db
      .select({
        id: schema.broadcastPost.id,
        parentId: schema.broadcastPost.parentId,
        content: schema.broadcastPost.content,
        createdAt: schema.broadcastPost.createdAt,
        user: {
          id: schema.user.id,
          name: schema.user.name,
          image: schema.user.image,
        },
      })
      .from(schema.broadcastPost)
      .innerJoin(schema.user, eq(schema.broadcastPost.userId, schema.user.id))
      .orderBy(desc(schema.broadcastPost.createdAt), desc(schema.broadcastPost.id))

    const posts = postRows as BroadcastPostRow[]
    const postIds = posts.map((item) => item.id)
    const imageRows =
      postIds.length > 0
        ? await db
            .select({
              postId: schema.broadcastPostImage.postId,
              imageUrl: schema.broadcastPostImage.imageUrl,
              sortOrder: schema.broadcastPostImage.sortOrder,
            })
            .from(schema.broadcastPostImage)
            .where(inArray(schema.broadcastPostImage.postId, postIds))
        : []

    const imagesByPostId = new Map<string, string[]>()
    for (const row of imageRows as BroadcastImageRow[]) {
      const existing = imagesByPostId.get(row.postId) ?? []
      existing[row.sortOrder] = row.imageUrl
      imagesByPostId.set(row.postId, existing)
    }
    for (const [postId, list] of imagesByPostId.entries()) {
      imagesByPostId.set(
        postId,
        list.filter((item): item is string => typeof item === "string"),
      )
    }

    const likeRows =
      postIds.length > 0
        ? await db
            .select({
              postId: schema.broadcastLike.postId,
              userId: schema.broadcastLike.userId,
            })
            .from(schema.broadcastLike)
            .where(inArray(schema.broadcastLike.postId, postIds))
        : []

    const likeCountMap = new Map<string, number>()
    const likedByMeSet = new Set<string>()
    for (const row of likeRows as Pick<BroadcastLikeModel, "postId" | "userId">[]) {
      likeCountMap.set(row.postId, (likeCountMap.get(row.postId) ?? 0) + 1)
      if (currentUserId && row.userId === currentUserId) {
        likedByMeSet.add(row.postId)
      }
    }

    const response = GetBroadcastResponseSchema.parse({
      posts: posts.map((item) => toBroadcastDto(item, imagesByPostId, likeCountMap, likedByMeSet)),
    })
    return c.json<GetBroadcastResponse>(response, 200)
  })

  .post("/", sessionAuth, zodValidator("json", CreateBroadcastPostBodySchema), async (c) => {
    const payload = c.req.valid("json")
    const parentId = normalizeNull(payload.parentId)
    const images = payload.images ?? []
    if (images.length > MAX_IMAGE_COUNT) {
      return c.json<ApiError>({ error: `At most ${MAX_IMAGE_COUNT} images are allowed` }, 400)
    }
    const db = drizzle(c.env.hexi_site)

    if (parentId) {
      const parent = await db
        .select({ id: schema.broadcastPost.id })
        .from(schema.broadcastPost)
        .where(eq(schema.broadcastPost.id, parentId))
        .get()
      if (!parent) {
        return c.json<ApiError>({ error: "parent post not found" }, 404)
      }
    }

    const origin = new URL(c.req.url).origin
    for (const imageUrl of images) {
      try {
        const parsed = new URL(imageUrl)
        const expectedPrefix = `${origin}/api/broadcast/image/`
        if (!parsed.toString().startsWith(expectedPrefix)) {
          return c.json<ApiError>({ error: "Invalid image URL" }, 400)
        }
      } catch {
        return c.json<ApiError>({ error: "Invalid image URL" }, 400)
      }
    }

    const user = c.get("user")
    const postId = crypto.randomUUID()
    const now = new Date()

    await db.insert(schema.broadcastPost).values({
      id: postId,
      parentId,
      userId: user.id,
      content: payload.content,
      createdAt: now,
      updatedAt: now,
    })
    if (images.length > 0) {
      await db.insert(schema.broadcastPostImage).values(
        images.map((imageUrl, sortOrder) => ({
          id: crypto.randomUUID(),
          postId,
          imageUrl,
          sortOrder,
          createdAt: now,
        })),
      )
    }

    const created = await db
      .select({
        id: schema.broadcastPost.id,
        parentId: schema.broadcastPost.parentId,
        content: schema.broadcastPost.content,
        createdAt: schema.broadcastPost.createdAt,
        user: {
          id: schema.user.id,
          name: schema.user.name,
          image: schema.user.image,
        },
      })
      .from(schema.broadcastPost)
      .innerJoin(schema.user, eq(schema.broadcastPost.userId, schema.user.id))
      .where(eq(schema.broadcastPost.id, postId))
      .get()

    if (!created) {
      return c.json<ApiError>({ error: "Failed to create post" }, 500)
    }

    const response = BroadcastPostSchema.parse(
      toBroadcastDto(
        created as BroadcastPostRow,
        new Map([[postId, images]]),
        new Map(),
        new Set(),
      ),
    )
    return c.json({ post: response }, 200)
  })

  .post("/image", sessionAuth, async (c) => {
    if (!c.env.AVATAR_BUCKET) {
      return c.json<ApiError>({ error: "AVATAR_BUCKET is not configured" }, 500)
    }

    const form = await c.req.formData()
    const fileCandidate = form.get("file")

    if (!fileCandidate || typeof fileCandidate === "string") {
      return c.json<ApiError>({ error: "file is required" }, 400)
    }

    const file = fileCandidate as Blob
    const contentType = file.type || "application/octet-stream"
    if (!IMAGE_ALLOWED_TYPES.has(contentType)) {
      return c.json<ApiError>({ error: "Only jpg/png/webp/gif are supported" }, 400)
    }
    if (file.size > IMAGE_MAX_SIZE) {
      return c.json<ApiError>({ error: "Image must be <= 8MB" }, 400)
    }

    const user = c.get("user")
    const filename = `${Date.now()}-${crypto.randomUUID()}.${extFromType(contentType)}`
    const imagePath = `${user.id}/${filename}`
    const key = `broadcast/${imagePath}`

    await c.env.AVATAR_BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    })

    return c.json(
      {
        image: `${new URL(c.req.url).origin}/api/broadcast/image/${imagePath}`,
      },
      200,
    )
  })

  .get("/image/:userId/:filename", async (c) => {
    if (!c.env.AVATAR_BUCKET) {
      return c.text("Bucket not configured", 500)
    }
    const userId = c.req.param("userId")
    const filename = c.req.param("filename")
    const key = `broadcast/${userId}/${filename}`
    const object = await c.env.AVATAR_BUCKET.get(key)

    if (!object) {
      return c.text("Not found", 404)
    }

    const headers = new Headers()
    object.writeHttpMetadata(headers)
    headers.set("etag", object.httpEtag)
    if (!headers.has("cache-control")) {
      headers.set("cache-control", "public, max-age=31536000, immutable")
    }
    return new Response(object.body, { headers })
  })

  .post("/:id/like", sessionAuth, zodValidator("param", BroadcastPostParamsSchema), async (c) => {
    const { id } = c.req.valid("param")
    const db = drizzle(c.env.hexi_site)
    const user = c.get("user")

    const post = await db
      .select({ id: schema.broadcastPost.id })
      .from(schema.broadcastPost)
      .where(eq(schema.broadcastPost.id, id))
      .get()

    if (!post) {
      return c.json<ApiError>({ error: "post not found" }, 404)
    }

    const existing = await db
      .select({ id: schema.broadcastLike.id })
      .from(schema.broadcastLike)
      .where(and(eq(schema.broadcastLike.postId, id), eq(schema.broadcastLike.userId, user.id)))
      .get()

    if (!existing) {
      await db.insert(schema.broadcastLike).values({
        id: crypto.randomUUID(),
        postId: id,
        userId: user.id,
        createdAt: new Date(),
      })
    }

    const response = ToggleLikeResponseSchema.parse({ success: true })
    return c.json<ToggleLikeResponse>(response, 200)
  })

  .delete(
    "/:id/like",
    sessionAuth,
    zodValidator("param", BroadcastPostParamsSchema),
    async (c) => {
      const { id } = c.req.valid("param")
      const db = drizzle(c.env.hexi_site)
      const user = c.get("user")

      await db
        .delete(schema.broadcastLike)
        .where(and(eq(schema.broadcastLike.postId, id), eq(schema.broadcastLike.userId, user.id)))

      const response = ToggleLikeResponseSchema.parse({ success: true })
      return c.json<ToggleLikeResponse>(response, 200)
    },
  )

  .get("/link-preview", zodValidator("query", LinkPreviewQuerySchema), async (c) => {
    const { url } = c.req.valid("query")
    const parsed = new URL(url)
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return c.json<ApiError>({ error: "Only http/https URLs are supported" }, 400)
    }

    const res = await fetch(parsed.toString(), {
      redirect: "follow",
      headers: {
        "user-agent": "HexiSiteBot/1.0 (+https://hexi.men)",
        accept: "text/html,application/xhtml+xml",
      },
    }).catch(() => null)

    if (!res || !res.ok) {
      return c.json<LinkPreviewResponse>(
        LinkPreviewResponseSchema.parse({
          preview: null,
        }),
        200,
      )
    }

    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("text/html")) {
      return c.json<LinkPreviewResponse>(
        LinkPreviewResponseSchema.parse({
          preview: null,
        }),
        200,
      )
    }

    const html = await res.text()
    const finalUrl = res.url || parsed.toString()

    const title =
      matchMetaContent(html, "og:title") ??
      matchMetaContent(html, "twitter:title") ??
      matchTitle(html)
    const description =
      matchMetaContent(html, "og:description") ??
      matchMetaContent(html, "twitter:description") ??
      matchMetaContent(html, "description")
    const image = toAbsoluteUrl(
      matchMetaContent(html, "og:image") ?? matchMetaContent(html, "twitter:image"),
      finalUrl,
    )
    const siteName = matchMetaContent(html, "og:site_name")

    const response = LinkPreviewResponseSchema.parse({
      preview: {
        url: finalUrl,
        title,
        description,
        image,
        siteName,
      },
    })
    return c.json<LinkPreviewResponse>(response, 200)
  })

export { broadcastRouter }
