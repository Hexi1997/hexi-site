import { Hono } from "hono"
import { drizzle } from "drizzle-orm/d1"
import type { InferSelectModel } from "drizzle-orm"
import { and, desc, eq, inArray, isNull, lt, or } from "drizzle-orm"
import { createSelectSchema } from "drizzle-zod"
import type { ApiError } from "@workspace/api-rpc"
import { z } from "zod"
import { sessionAuth } from "../middleware/auth"
import * as schema from "../schema"
import type { AppEnv } from "../types"
import { zodValidator } from "../lib/zod-validator"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

const UserSelectSchema = createSelectSchema(schema.user)
const CommentSelectSchema = createSelectSchema(schema.comment)

const CommentUserSchema = UserSelectSchema.pick({
  id: true,
  name: true,
  image: true,
})

const CommentSchema = CommentSelectSchema.pick({
  id: true,
  parentId: true,
  content: true,
}).extend({
  createdAt: z.string(),
  user: CommentUserSchema,
})

const GetCommentsQuerySchema = CommentSelectSchema.pick({
  postSlug: true,
}).extend({
  limit: z.string().optional(),
  cursor: z.string().optional(),
})

const GetCommentsResponseSchema = z.object({
  comments: z.array(CommentSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
})

const CreateCommentBodySchema = CommentSelectSchema.pick({
  postSlug: true,
  parentId: true,
  content: true,
})

const CreateCommentResponseSchema = z.object({
  comment: CommentSchema,
})

type GetCommentsResponse = z.infer<typeof GetCommentsResponseSchema>
type CreateCommentResponse = z.infer<typeof CreateCommentResponseSchema>
type CommentModel = InferSelectModel<typeof schema.comment>
type UserModel = InferSelectModel<typeof schema.user>
type CommentUserDto = Pick<UserModel, "id" | "name" | "image">
type CommentDto = Pick<CommentModel, "id" | "parentId" | "content"> & {
  createdAt: string
  user: CommentUserDto
}
type CommentRow = Pick<CommentModel, "id" | "postSlug" | "parentId" | "content" | "createdAt"> & {
  user: CommentUserDto
}

const comments = new Hono<AppEnv>()

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

function toCommentDto(item: CommentRow): CommentDto {
  return {
    id: item.id,
    parentId: item.parentId,
    content: item.content,
    createdAt: item.createdAt.toISOString(),
    user: item.user,
  }
}

function commentRowSelection() {
  return {
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
  }
}

const commentsRouter = comments
  .get("/", zodValidator("query", GetCommentsQuerySchema), async (c) => {
  const { postSlug, limit, cursor: rawCursor } = c.req.valid("query")
  const pageSize = parsePageSize(limit)
  const cursor = parseCursor(rawCursor)
  if (rawCursor && !cursor) {
    return c.json({ error: "Invalid cursor" }, 400)
  }

  const db = drizzle(c.env.hexi_site)
  const rootWhere = cursor
    ? and(
        eq(schema.comment.postSlug, postSlug),
        isNull(schema.comment.parentId),
        or(
          lt(schema.comment.createdAt, new Date(cursor.ts)),
          and(eq(schema.comment.createdAt, new Date(cursor.ts)), lt(schema.comment.id, cursor.id)),
        ),
      )
    : and(eq(schema.comment.postSlug, postSlug), isNull(schema.comment.parentId))

  const rootRows = await db
    .select(commentRowSelection())
    .from(schema.comment)
    .innerJoin(schema.user, eq(schema.comment.userId, schema.user.id))
    .where(rootWhere)
    .orderBy(desc(schema.comment.createdAt), desc(schema.comment.id))
    .limit(pageSize + 1)

  const rootPage = rootRows as CommentRow[]
  const hasMore = rootPage.length > pageSize
  const currentRoots = hasMore ? rootPage.slice(0, pageSize) : rootPage

  const commentsForPage: CommentRow[] = [...currentRoots]
  let frontier = currentRoots.map((item) => item.id)

  while (frontier.length > 0) {
    const childRows = await db
      .select(commentRowSelection())
      .from(schema.comment)
      .innerJoin(schema.user, eq(schema.comment.userId, schema.user.id))
      .where(
        and(
          eq(schema.comment.postSlug, postSlug),
          inArray(schema.comment.parentId, frontier),
        ),
      )
      .orderBy(desc(schema.comment.createdAt), desc(schema.comment.id))

    const children = childRows as CommentRow[]
    if (children.length === 0) break

    commentsForPage.push(...children)
    frontier = children.map((item) => item.id)
  }

  const responseComments = commentsForPage
    .sort((a, b) => {
      const diff = a.createdAt.getTime() - b.createdAt.getTime()
      if (diff !== 0) return diff
      return a.id.localeCompare(b.id)
    })
    .map(toCommentDto)

  const nextCursor =
    hasMore && currentRoots.length > 0
      ? encodeCursor(
          currentRoots[currentRoots.length - 1].createdAt,
          currentRoots[currentRoots.length - 1].id,
        )
      : null

  const response = GetCommentsResponseSchema.parse({
    comments: responseComments,
    nextCursor,
    hasMore,
  })
  return c.json<GetCommentsResponse>(response, 200)
})

  .post("/", sessionAuth, zodValidator("json", CreateCommentBodySchema), async (c) => {
  const payload = c.req.valid("json")
  const postSlug = payload.postSlug
  const content = payload.content
  const parentId = payload.parentId ?? null

  const db = drizzle(c.env.hexi_site)
  if (parentId) {
    const parent = await db
      .select({ id: schema.comment.id })
      .from(schema.comment)
      .where(and(eq(schema.comment.id, parentId), eq(schema.comment.postSlug, postSlug)))
      .get()
    if (!parent) {
      return c.json<ApiError>({ error: "parent comment not found" }, 404)
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
    return c.json<ApiError>({ error: "Failed to create comment" }, 500)
  }

  const response = CreateCommentResponseSchema.parse({
    comment: toCommentDto(created as CommentRow),
  })
  return c.json<CreateCommentResponse>(response, 200)
})

export { commentsRouter }
