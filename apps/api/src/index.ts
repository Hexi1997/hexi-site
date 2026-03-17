import { Hono } from "hono"
import { cors } from "hono/cors"
import { createAuth } from "./lib/auth"
import { ALLOWED_ORIGINS } from "./constants"

const app = new Hono()

// 非 /api 开头的路径全部 302 重定向到主站 https://hexi.men，保留原始 path 与 query。
app.use("*", async (c, next) => {
  const url = new URL(c.req.url)
  if (!url.pathname.startsWith("/api")) {
    const target = `https://hexi.men${url.pathname}${url.search}`
    return c.redirect(target, 302)
  }
  return next()
})

// 简单健康检查（供 /api/health 使用）
app.get("/api/health", (c) => c.text("OK"))

app.use(
  "/api/auth/*",
  cors({
    origin: (origin) =>
      origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
  })
)

app.all("/api/auth/*", async (c) => {
  const auth = createAuth(c.env as any)
  return auth.handler(c.req.raw)
})

export default app