import { Hono } from "hono"
import { drizzle } from "drizzle-orm/d1"
import type { InferSelectModel } from "drizzle-orm"
import { eq } from "drizzle-orm"
import { createSelectSchema } from "drizzle-zod"
import type { ApiError } from "@workspace/api-rpc"
import { z } from "zod"
import { createAuth } from "../lib/auth"
import { sessionAuth } from "../middleware/auth"
import * as schema from "../schema"
import type { AppEnv } from "../types"
import {
  avatarPathFromURL,
  extFromType,
  errorMessageFromUnknown,
  errorStatusFromUnknown,
} from "../lib/utils"
import { zodValidator } from "../lib/zod-validator"

const AVATAR_MAX_SIZE = 2 * 1024 * 1024
const AVATAR_UPLOAD_COOLDOWN_MS = 60 * 60 * 1000
const AVATAR_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

const profile = new Hono<AppEnv>()

const UserSelectSchema = createSelectSchema(schema.user)

const ProfileUserSchema = UserSelectSchema.pick({
  id: true,
  email: true,
  name: true,
  image: true,
})

const ProfileResponseSchema = z.object({
  user: ProfileUserSchema,
})

const UpdateProfileBodySchema = z
  .object({
    name: z.string().trim().min(2).max(32).optional(),
    image: z.string().nullable().optional(),
  })
  .refine((value) => value.name !== undefined || value.image !== undefined, {
    message: "No valid fields to update",
  })

const ChangePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
})

const ChangePasswordResponseSchema = z.object({
  success: z.literal(true),
})

const UploadAvatarResponseSchema = z.object({
  image: z.string(),
})

type ProfileResponse = z.infer<typeof ProfileResponseSchema>
type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>
type UploadAvatarResponse = z.infer<typeof UploadAvatarResponseSchema>

const profileRouter = profile
  .get("/", sessionAuth, async (c) => {
  const user = c.get("user")
  const response = ProfileResponseSchema.parse({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image ?? null,
    },
  })
  return c.json<ProfileResponse>(response, 200)
})

  .patch("/", sessionAuth, zodValidator("json", UpdateProfileBodySchema), async (c) => {
  const payload = c.req.valid("json")
  const updates: { name?: string; image?: string | null; updatedAt?: Date } = {}

  if (payload.name !== undefined) {
    updates.name = payload.name
  }

  if (payload.image !== undefined) {
    updates.image = payload.image
  }

  updates.updatedAt = new Date()

  const db = drizzle(c.env.hexi_site)
  const user = c.get("user")

  await db.update(schema.user).set(updates).where(eq(schema.user.id, user.id))

  const updated = await db
    .select({
      id: schema.user.id,
      email: schema.user.email,
      name: schema.user.name,
      image: schema.user.image,
    })
    .from(schema.user)
    .where(eq(schema.user.id, user.id))
    .get()

  const response = ProfileResponseSchema.parse({ user: updated })
  return c.json<ProfileResponse>(response, 200)
})

  .post("/password", sessionAuth, zodValidator("json", ChangePasswordBodySchema), async (c) => {
  const { currentPassword, newPassword } = c.req.valid("json")

  try {
    const auth = createAuth(c.env as any)
    await auth.api.changePassword({
      headers: c.req.raw.headers,
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      },
    })
    const response = ChangePasswordResponseSchema.parse({ success: true })
    return c.json<ChangePasswordResponse>(response, 200)
  } catch (err) {
    return c.json<ApiError>(
      { error: errorMessageFromUnknown(err) },
      errorStatusFromUnknown(err) as any,
    )
  }
})

  .post("/avatar", sessionAuth, async (c) => {
  if (!c.env.AVATAR_BUCKET) {
    return c.json<ApiError>({ error: "AVATAR_BUCKET is not configured" }, 500)
  }

  const db = drizzle(c.env.hexi_site)
  const user = c.get("user")
  const currentUser = await db
    .select({
      image: schema.user.image,
      avatarUploadedAt: schema.user.avatarUploadedAt,
    })
    .from(schema.user)
    .where(eq(schema.user.id, user.id))
    .get()

  if (!currentUser) {
    return c.json<ApiError>({ error: "User not found" }, 404)
  }

  const now = new Date()
  const avatarUploadedAt = currentUser.avatarUploadedAt
  if (avatarUploadedAt) {
    const retryAfterSeconds = Math.ceil(
      (avatarUploadedAt.getTime() + AVATAR_UPLOAD_COOLDOWN_MS - now.getTime()) / 1000,
    )
    if (retryAfterSeconds > 0) {
      c.header("Retry-After", String(retryAfterSeconds))
      return c.json<ApiError>(
        {
          error: "Avatar can only be updated once per hour",
          code: "AVATAR_UPLOAD_RATE_LIMITED",
        },
        429,
      )
    }
  }

  const form = await c.req.formData()
  const fileCandidate = form.get("file")

  if (!fileCandidate || typeof fileCandidate === "string") {
    return c.json<ApiError>({ error: "file is required" }, 400)
  }

  const file = fileCandidate as Blob
  const contentType = file.type || "application/octet-stream"

  if (!AVATAR_ALLOWED_TYPES.has(contentType)) {
    return c.json<ApiError>({ error: "Only jpg/png/webp/gif are supported" }, 400)
  }

  if (file.size > AVATAR_MAX_SIZE) {
    return c.json<ApiError>({ error: "Avatar must be <= 2MB" }, 400)
  }
  const filename = `${Date.now()}-${crypto.randomUUID()}.${extFromType(contentType)}`
  const avatarPath = `${user.id}/${filename}`
  const key = `avatars/${avatarPath}`

  await c.env.AVATAR_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    },
  })

  const imageURL = `${new URL(c.req.url).origin}/api/profile/avatar/${avatarPath}`

  await db
    .update(schema.user)
    .set({
      image: imageURL,
      avatarUploadedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.user.id, user.id))

  const previous = avatarPathFromURL(currentUser.image)
  if (previous && previous !== avatarPath) {
    await c.env.AVATAR_BUCKET.delete(`avatars/${previous}`)
  }

  const response = UploadAvatarResponseSchema.parse({ image: imageURL })
  return c.json<UploadAvatarResponse>(response, 200)
})

  .get("/avatar/:userId/:filename", async (c) => {
  if (!c.env.AVATAR_BUCKET) {
    return c.text("Bucket not configured", 500)
  }

  const userId = c.req.param("userId")
  const filename = c.req.param("filename")
  const key = `avatars/${userId}/${filename}`
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

export { profileRouter }
