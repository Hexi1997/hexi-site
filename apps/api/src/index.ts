import { Hono } from "hono"
import { cors } from "hono/cors"
import { createAuth } from "./lib/auth"
import { ALLOWED_ORIGINS } from "./constants"

const app = new Hono()

app.get("/", (c) => c.text("OK"))

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