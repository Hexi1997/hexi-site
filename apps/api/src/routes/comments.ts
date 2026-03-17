import { Hono } from "hono"
import { drizzle } from "drizzle-orm/d1"
import { and, desc, eq } from "drizzle-orm"
import { sessionAuth } from "../middleware/auth"
import * as schema from "../schema"
import type { AppEnv } from "../types"
import { jsonError } from "../lib/utils"

const MAX_CONTENT_LENGTH = 2000
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

type CommentRow = {
  id: string
  postSlug: string
  parentId: string | null
  content: string
  createdAt: Date
  user: {
    id: string
    name: string
    image: string | null
  }
}

const comments = new Hono<AppEnv>()

function normalizePostSlug(input: unknown) {
  if (typeof input !== "string") return null
  const slug = input.trim()
  if (!slug || slug.length > 200) return null
  return slug
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

function rootSorter(a: CommentRow, b: CommentRow) {
  const diff = b.createdAt.getTime() - a.createdAt.getTime()
  if (diff !== 0) return diff
  return b.id.localeCompare(a.id)
}

function collectSubtreeIds(childrenByParent: Map<string, string[]>, rootIds: string[]) {
  const included = new Set(rootIds)
  const stack = [...rootIds]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue
    const children = childrenByParent.get(current) ?? []
    for (const childId of children) {
      if (!included.has(childId)) {
        included.add(childId)
        stack.push(childId)
      }
    }
  }
  return included
}

comments.get("/", async (c) => {
  const postSlug = normalizePostSlug(c.req.query("postSlug"))
  if (!postSlug) {
    return jsonError("postSlug is required")
  }

  const pageSize = parsePageSize(c.req.query("limit"))
  const cursor = parseCursor(c.req.query("cursor"))
  if (c.req.query("cursor") && !cursor) {
    return jsonError("Invalid cursor")
  }

  const db = drizzle(c.env.hexi_site)
  const rows = await db
    .select({
      id: schema.comment.id,
      postSlug: schema.comment.postSlug,
      parentId: schema.comment.parentId,
      content: schema.comment.content,
      createdAt: schema.comment.createdAt,
      user: {
        id: schema.user.id,
        name: schema.user.name,
        image: schema.user.image,
      },
    })
    .from(schema.comment)
    .innerJoin(schema.user, eq(schema.comment.userId, schema.user.id))
    .where(eq(schema.comment.postSlug, postSlug))
    .orderBy(desc(schema.comment.createdAt), desc(schema.comment.id))

  const all = rows as CommentRow[]
  const allRootComments = all.filter((item) => item.parentId === null).sort(rootSorter)

  const rootPage = allRootComments
    .filter((item) => {
      if (!cursor) return true
      const time = item.createdAt.getTime()
      return time < cursor.ts || (time === cursor.ts && item.id < cursor.id)
    })
    .slice(0, pageSize + 1)

  const hasMore = rootPage.length > pageSize
  const currentRoots = hasMore ? rootPage.slice(0, pageSize) : rootPage

  const childrenByParent = new Map<string, string[]>()
  for (const item of all) {
    if (!item.parentId) continue
    const existing = childrenByParent.get(item.parentId)
    if (existing) {
      existing.push(item.id)
    } else {
      childrenByParent.set(item.parentId, [item.id])
    }
  }

  const includedIds = collectSubtreeIds(
    childrenByParent,
    currentRoots.map((item) => item.id),
  )

  const commentsForPage = all
    .filter((item) => includedIds.has(item.id))
    .sort((a, b) => {
      const diff = a.createdAt.getTime() - b.createdAt.getTime()
      if (diff !== 0) return diff
      return a.id.localeCompare(b.id)
    })
    .map((item) => ({
      id: item.id,
      postSlug: item.postSlug,
      parentId: item.parentId,
      content: item.content,
      createdAt: item.createdAt.toISOString(),
      user: item.user,
    }))

  const nextCursor =
    hasMore && currentRoots.length > 0
      ? encodeCursor(
          currentRoots[currentRoots.length - 1].createdAt,
          currentRoots[currentRoots.length - 1].id,
        )
      : null

  return c.json({
    comments: commentsForPage,
    nextCursor,
    hasMore,
  })
})

comments.post("/", sessionAuth, async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  if (!body || typeof body !== "object") {
    return jsonError("Invalid request body")
  }

  const payload = body as { postSlug?: unknown; parentId?: unknown; content?: unknown }

  const postSlug = normalizePostSlug(payload.postSlug)
  if (!postSlug) {
    return jsonError("postSlug is required")
  }

  if (typeof payload.content !== "string") {
    return jsonError("content must be a string")
  }
  const content = payload.content.trim()
  if (!content) {
    return jsonError("content cannot be empty")
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    return jsonError(`content must be <= ${MAX_CONTENT_LENGTH} characters`)
  }

  let parentId: string | null = null
  if (payload.parentId !== undefined && payload.parentId !== null) {
    if (typeof payload.parentId !== "string" || !payload.parentId.trim()) {
      return jsonError("parentId must be a non-empty string when provided")
    }
    parentId = payload.parentId.trim()
  }

  const db = drizzle(c.env.hexi_site)
  if (parentId) {
    const parent = await db
      .select({ id: schema.comment.id })
      .from(schema.comment)
      .where(and(eq(schema.comment.id, parentId), eq(schema.comment.postSlug, postSlug)))
      .get()
    if (!parent) {
      return jsonError("parent comment not found", 404)
    }
  }

  const user = c.get("user")
  const now = new Date()
  const commentId = crypto.randomUUID()

  await db.insert(schema.comment).values({
    id: commentId,
    postSlug,
    parentId,
    userId: user.id,
    content,
    createdAt: now,
    updatedAt: now,
  })

  const created = await db
    .select({
      id: schema.comment.id,
      postSlug: schema.comment.postSlug,
      parentId: schema.comment.parentId,
      content: schema.comment.content,
      createdAt: schema.comment.createdAt,
      user: {
        id: schema.user.id,
        name: schema.user.name,
        image: schema.user.image,
      },
    })
    .from(schema.comment)
    .innerJoin(schema.user, eq(schema.comment.userId, schema.user.id))
    .where(eq(schema.comment.id, commentId))
    .get()

  if (!created) {
    return jsonError("Failed to create comment", 500)
  }

  return c.json({
    comment: {
      ...created,
      createdAt: created.createdAt.toISOString(),
    },
  })
})

export default comments
