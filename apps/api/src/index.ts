import { Hono } from "hono"
import { cors } from "hono/cors"
import { ALLOWED_ORIGINS } from "./constants"
import type { AppEnv } from "./types"
import authRouter from "./routes/auth"
import profileRouter from "./routes/profile"
import commentsRouter from "./routes/comments"

const app = new Hono<AppEnv>()

app.use("*", async (c, next) => {
  const url = new URL(c.req.url)
  if (!url.pathname.startsWith("/api")) {
    const target = `https://hexi.men${url.pathname}${url.search}`
    return c.redirect(target, 302)
  }
  return next()
})

app.get("/api/health", (c) => c.text("OK"))

app.use(
  "/api/*",
  cors({
    origin: (origin) =>
      origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
  })
)

app.route("/api/auth", authRouter)
app.route("/api/profile", profileRouter)
app.route("/api/comments", commentsRouter)

export default app
