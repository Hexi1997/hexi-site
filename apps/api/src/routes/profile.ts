import { Hono } from "hono"
import { drizzle } from "drizzle-orm/d1"
import { eq } from "drizzle-orm"
import { createAuth } from "../lib/auth"
import { sessionAuth } from "../middleware/auth"
import * as schema from "../schema"
import type { AppEnv } from "../types"
import {
  jsonError,
  avatarPathFromURL,
  extFromType,
  errorMessageFromUnknown,
  errorStatusFromUnknown,
} from "../lib/utils"

const AVATAR_MAX_SIZE = 2 * 1024 * 1024
const AVATAR_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

const profile = new Hono<AppEnv>()

profile.get("/", sessionAuth, async (c) => {
  const user = c.get("user")
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image ?? null,
    },
  })
})

profile.patch("/", sessionAuth, async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  if (!body || typeof body !== "object") {
    return jsonError("Invalid request body")
  }

  const payload = body as { name?: unknown; image?: unknown }
  const updates: { name?: string; image?: string | null; updatedAt?: Date } = {}

  if (payload.name !== undefined) {
    if (typeof payload.name !== "string") {
      return jsonError("name must be a string")
    }
    const name = payload.name.trim()
    if (name.length < 2 || name.length > 32) {
      return jsonError("name length must be 2-32 characters")
    }
    updates.name = name
  }

  if (payload.image !== undefined) {
    if (payload.image !== null && typeof payload.image !== "string") {
      return jsonError("image must be null or string")
    }
    updates.image = payload.image
  }

  if (!("name" in updates) && !("image" in updates)) {
    return jsonError("No valid fields to update")
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

  return c.json({ user: updated })
})

profile.post("/password", sessionAuth, async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  if (!body || typeof body !== "object") {
    return jsonError("Invalid request body")
  }

  const payload = body as { currentPassword?: unknown; newPassword?: unknown }
  if (typeof payload.currentPassword !== "string" || typeof payload.newPassword !== "string") {
    return jsonError("currentPassword and newPassword are required")
  }

  const currentPassword = payload.currentPassword
  const newPassword = payload.newPassword

  if (newPassword.length < 8 || newPassword.length > 72) {
    return jsonError("newPassword length must be 8-72 characters")
  }

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
    return c.json({ success: true })
  } catch (err) {
    return jsonError(errorMessageFromUnknown(err), errorStatusFromUnknown(err))
  }
})

profile.post("/avatar", sessionAuth, async (c) => {
  if (!c.env.AVATAR_BUCKET) {
    return jsonError("AVATAR_BUCKET is not configured", 500)
  }

  const form = await c.req.formData()
  const fileCandidate = form.get("file")

  if (!fileCandidate || typeof fileCandidate === "string") {
    return jsonError("file is required")
  }

  const file = fileCandidate as Blob
  const contentType = file.type || "application/octet-stream"

  if (!AVATAR_ALLOWED_TYPES.has(contentType)) {
    return jsonError("Only jpg/png/webp/gif are supported")
  }

  if (file.size > AVATAR_MAX_SIZE) {
    return jsonError("Avatar must be <= 2MB")
  }

  const user = c.get("user")
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

  const db = drizzle(c.env.hexi_site)
  await db
    .update(schema.user)
    .set({
      image: imageURL,
      updatedAt: new Date(),
    })
    .where(eq(schema.user.id, user.id))

  const previous = avatarPathFromURL(user.image)
  if (previous && previous !== avatarPath) {
    await c.env.AVATAR_BUCKET.delete(`avatars/${previous}`)
  }

  return c.json({ image: imageURL })
})

profile.get("/avatar/:userId/:filename", async (c) => {
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

export default profile
