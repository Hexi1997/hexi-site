import { Hono } from "hono"
import { cors } from "hono/cors"
import { auth } from "./lib/auth"

export const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://hexi.men",
  "https://2437951611.workers.dev",
]

const app = new Hono()

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
  return auth.handler(c.req.raw)
})

export default app