import { Hono } from "hono"
import type { Context } from "hono"
import { drizzle } from "drizzle-orm/d1"
import type { InferSelectModel } from "drizzle-orm"
import { and, desc, eq, gte, inArray, isNull, lt, or, sql } from "drizzle-orm"
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
const IMAGE_UPLOAD_LIMIT_PER_MINUTE = 8
const IMAGE_UPLOAD_LIMIT_PER_DAY = 100
const IMAGE_UPLOAD_MINUTE_WINDOW_MS = 60 * 1000
const IMAGE_UPLOAD_DAY_WINDOW_MS = 24 * 60 * 60 * 1000
const IMAGE_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

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
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
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

const DeleteBroadcastPostResponseSchema = z.object({
  success: z.literal(true),
})

const LinkPreviewQuerySchema = z.object({
  url: z.string().trim().url(),
})

const GetBroadcastQuerySchema = z.object({
  limit: z.string().optional(),
  cursor: z.string().optional(),
})

const LinkPreviewImageQuerySchema = z.object({
  url: z.string().trim().url(),
})

const LinkPreviewSchema = z.object({
  url: z.string().url(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  image: z.string().url().nullable(),
  siteName: z.string().nullable(),
  type: z.string().nullable(),
})

const LinkPreviewResponseSchema = z.object({
  preview: LinkPreviewSchema.nullable(),
})

type GetBroadcastResponse = z.infer<typeof GetBroadcastResponseSchema>
type ToggleLikeResponse = z.infer<typeof ToggleLikeResponseSchema>
type DeleteBroadcastPostResponse = z.infer<typeof DeleteBroadcastPostResponseSchema>
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

function parsePageSize(input: string | undefined) {
  if (!input) return DEFAULT_PAGE_SIZE
  const parsed = Number(input)
  if (!Number.isInteger(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE
  return Math.min(parsed, MAX_PAGE_SIZE)
}

function encodeCursor(createdAt: Date, id: string) {
  return `${createdAt.getTime()}_${id}`
}

function parseCursor(cursor: string | undefined) {
  if (!cursor) return null
  const splitIndex = cursor.indexOf("_")
  if (splitIndex <= 0) return null
  const ts = Number(cursor.slice(0, splitIndex))
  const id = cursor.slice(splitIndex + 1)
  if (!Number.isFinite(ts) || !id) return null
  return { ts, id }
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

function broadcastImageKeyFromUrl(url: string) {
  try {
    const parsed = new URL(url)
    const matched = parsed.pathname.match(/^\/api\/broadcast\/image\/([^/]+)\/([^/]+)$/)
    if (!matched?.[1] || !matched?.[2]) return null
    return `broadcast/${matched[1]}/${matched[2]}`
  } catch {
    return null
  }
}

function shouldProxyPreviewImage(imageUrl: string) {
  try {
    const host = new URL(imageUrl).hostname.toLowerCase()
    return host === "i0.hdslb.com" ||
      host === "i1.hdslb.com" ||
      host === "i2.hdslb.com" ||
      host.endsWith(".hdslb.com")
  } catch {
    return false
  }
}

function getPreviewImageProxyUrl(c: Context<AppEnv>, imageUrl: string) {
  const currentUrl = new URL(c.req.url)
  const proxyUrl = new URL("/api/broadcast/link-preview/image", currentUrl.origin)
  proxyUrl.searchParams.set("url", imageUrl)
  return proxyUrl.toString()
}

function buildPreviewImageHeaders(imageUrl: string) {
  const headers: Record<string, string> = {
    "user-agent": "HexiSiteBot/1.0 (+https://hexi.men)",
    accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  }

  if (shouldProxyPreviewImage(imageUrl)) {
    headers.referer = "https://www.bilibili.com/"
  }

  return headers
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

async function getBroadcastImageUploadCount(
  db: ReturnType<typeof drizzle>,
  userId: string,
  since: Date,
) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.broadcastImageUpload)
    .where(
      and(
        eq(schema.broadcastImageUpload.userId, userId),
        gte(schema.broadcastImageUpload.createdAt, since),
      ),
    )
    .get()

  return Number(result?.count ?? 0)
}

const broadcastRouter = broadcast
  .get("/", zodValidator("query", GetBroadcastQuerySchema), async (c) => {
    const db = drizzle(c.env.hexi_site)
    const currentUserId = await getCurrentUserId(c)
    const { limit, cursor: rawCursor } = c.req.valid("query")
    const pageSize = parsePageSize(limit)
    const cursor = parseCursor(rawCursor)
    if (rawCursor && !cursor) {
      return c.json<ApiError>({ error: "Invalid cursor" }, 400)
    }

    const rootWhere = cursor
      ? and(
          isNull(schema.broadcastPost.parentId),
          or(
            lt(schema.broadcastPost.createdAt, new Date(cursor.ts)),
            and(
              eq(schema.broadcastPost.createdAt, new Date(cursor.ts)),
              lt(schema.broadcastPost.id, cursor.id),
            ),
          ),
        )
      : isNull(schema.broadcastPost.parentId)

    const rootRows = await db
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
      .where(rootWhere)
      .orderBy(desc(schema.broadcastPost.createdAt), desc(schema.broadcastPost.id))
      .limit(pageSize + 1)

    const rootPage = rootRows as BroadcastPostRow[]

    const hasMore = rootPage.length > pageSize
    const currentRoots = hasMore ? rootPage.slice(0, pageSize) : rootPage

    const posts: BroadcastPostRow[] = [...currentRoots]
    let frontier = currentRoots.map((item) => item.id)
    while (frontier.length > 0) {
      const childRows = await db
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
        .where(inArray(schema.broadcastPost.parentId, frontier))
        .orderBy(desc(schema.broadcastPost.createdAt), desc(schema.broadcastPost.id))

      const children = childRows as BroadcastPostRow[]
      if (children.length === 0) break
      posts.push(...children)
      frontier = children.map((item) => item.id)
    }

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

    const nextCursor =
      hasMore && currentRoots.length > 0
        ? encodeCursor(
            currentRoots[currentRoots.length - 1].createdAt,
            currentRoots[currentRoots.length - 1].id,
          )
        : null

    const response = GetBroadcastResponseSchema.parse({
      posts: posts.map((item) => toBroadcastDto(item, imagesByPostId, likeCountMap, likedByMeSet)),
      nextCursor,
      hasMore,
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

    const db = drizzle(c.env.hexi_site)
    const user = c.get("user")
    const now = new Date()
    const [uploadsLastMinute, uploadsLastDay] = await Promise.all([
      getBroadcastImageUploadCount(
        db,
        user.id,
        new Date(now.getTime() - IMAGE_UPLOAD_MINUTE_WINDOW_MS),
      ),
      getBroadcastImageUploadCount(
        db,
        user.id,
        new Date(now.getTime() - IMAGE_UPLOAD_DAY_WINDOW_MS),
      ),
    ])

    if (uploadsLastMinute >= IMAGE_UPLOAD_LIMIT_PER_MINUTE) {
      c.header("Retry-After", "60")
      return c.json<ApiError>(
        {
          error: `At most ${IMAGE_UPLOAD_LIMIT_PER_MINUTE} images can be uploaded per minute`,
          code: "BROADCAST_IMAGE_UPLOAD_MINUTE_LIMIT",
        },
        429,
      )
    }

    if (uploadsLastDay >= IMAGE_UPLOAD_LIMIT_PER_DAY) {
      c.header("Retry-After", String(24 * 60 * 60))
      return c.json<ApiError>(
        {
          error: `At most ${IMAGE_UPLOAD_LIMIT_PER_DAY} images can be uploaded per 24 hours`,
          code: "BROADCAST_IMAGE_UPLOAD_DAY_LIMIT",
        },
        429,
      )
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

    const filename = `${Date.now()}-${crypto.randomUUID()}.${extFromType(contentType)}`
    const imagePath = `${user.id}/${filename}`
    const key = `broadcast/${imagePath}`

    await c.env.AVATAR_BUCKET.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    })

    await db.insert(schema.broadcastImageUpload).values({
      id: crypto.randomUUID(),
      userId: user.id,
      objectKey: key,
      createdAt: now,
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

  .delete("/:id", sessionAuth, zodValidator("param", BroadcastPostParamsSchema), async (c) => {
    const { id } = c.req.valid("param")
    const db = drizzle(c.env.hexi_site)
    const user = c.get("user")

    const post = await db
      .select({
        id: schema.broadcastPost.id,
        userId: schema.broadcastPost.userId,
      })
      .from(schema.broadcastPost)
      .where(eq(schema.broadcastPost.id, id))
      .get()

    if (!post) {
      return c.json<ApiError>({ error: "Post not found" }, 404)
    }
    if (post.userId !== user.id) {
      return c.json<ApiError>({ error: "You can only delete your own posts" }, 403)
    }

    const child = await db
      .select({ id: schema.broadcastPost.id })
      .from(schema.broadcastPost)
      .where(eq(schema.broadcastPost.parentId, id))
      .get()

    if (child) {
      return c.json<ApiError>({ error: "Posts with replies cannot be deleted" }, 400)
    }

    const imageRows = await db
      .select({ imageUrl: schema.broadcastPostImage.imageUrl })
      .from(schema.broadcastPostImage)
      .where(eq(schema.broadcastPostImage.postId, id))

    await db.delete(schema.broadcastLike).where(eq(schema.broadcastLike.postId, id))
    await db.delete(schema.broadcastPostImage).where(eq(schema.broadcastPostImage.postId, id))
    await db.delete(schema.broadcastPost).where(eq(schema.broadcastPost.id, id))

    if (c.env.AVATAR_BUCKET) {
      await Promise.all(
        imageRows
          .map((row) => broadcastImageKeyFromUrl(row.imageUrl))
          .filter((key): key is string => Boolean(key))
          .map((key) => c.env.AVATAR_BUCKET.delete(key)),
      )
    }

    const response = DeleteBroadcastPostResponseSchema.parse({ success: true })
    return c.json<DeleteBroadcastPostResponse>(response, 200)
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
    let previewUrl = finalUrl
    if (parsed.hash) {
      try {
        const withHash = new URL(finalUrl)
        withHash.hash = parsed.hash
        previewUrl = withHash.toString()
      } catch {
        previewUrl = parsed.toString()
      }
    }

    const title =
      matchMetaContent(html, "og:title") ??
      matchMetaContent(html, "twitter:title") ??
      matchTitle(html)
    const description =
      matchMetaContent(html, "og:description") ??
      matchMetaContent(html, "twitter:description") ??
      matchMetaContent(html, "description")
    const rawImage = toAbsoluteUrl(
      matchMetaContent(html, "og:image") ?? matchMetaContent(html, "twitter:image"),
      finalUrl,
    )
    const image = rawImage && shouldProxyPreviewImage(rawImage)
      ? getPreviewImageProxyUrl(c, rawImage)
      : rawImage
    const siteName = matchMetaContent(html, "og:site_name")
    const type = matchMetaContent(html, "og:type")

    const response = LinkPreviewResponseSchema.parse({
      preview: {
        url: previewUrl,
        title,
        description,
        image,
        siteName,
        type,
      },
    })
    return c.json<LinkPreviewResponse>(response, 200)
  })

  .get("/link-preview/image", zodValidator("query", LinkPreviewImageQuerySchema), async (c) => {
    const { url } = c.req.valid("query")
    const parsed = new URL(url)
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return c.json<ApiError>({ error: "Only http/https URLs are supported" }, 400)
    }

    const res = await fetch(parsed.toString(), {
      redirect: "follow",
      headers: buildPreviewImageHeaders(parsed.toString()),
    }).catch(() => null)

    if (!res || !res.ok || !res.body) {
      return c.json<ApiError>({ error: "Failed to fetch preview image" }, 404)
    }

    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.startsWith("image/")) {
      return c.json<ApiError>({ error: "Preview image is not an image" }, 400)
    }

    const headers = new Headers()
    headers.set("content-type", contentType)
    headers.set("cache-control", "public, max-age=86400")
    const contentLength = res.headers.get("content-length")
    if (contentLength) {
      headers.set("content-length", contentLength)
    }

    return new Response(res.body, {
      status: 200,
      headers,
    })
  })

export { broadcastRouter }
