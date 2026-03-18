import type { Context, Next } from "hono"
import type { ApiError } from "@workspace/api-rpc"
import { createAuth } from "../lib/auth"

/** User-facing: validates a better-auth session (cookie or Bearer session token) */
export async function sessionAuth(c: Context, next: Next) {
  const auth = createAuth(c.env as any)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    return c.json<ApiError>({ error: "Not authenticated" }, 401)
  }
  c.set("user", session.user)
  c.set("session", session.session)
  await next()
}
