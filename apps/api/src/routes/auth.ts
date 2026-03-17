import { Hono } from "hono"
import { createAuth } from "../lib/auth"
import type { AppEnv } from "../types"

const auth = new Hono<AppEnv>()

auth.all("/*", async (c) => {
  const authInstance = createAuth(c.env as any)
  return authInstance.handler(c.req.raw)
})

export default auth
