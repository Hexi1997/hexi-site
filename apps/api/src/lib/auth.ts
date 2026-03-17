import { betterAuth } from "better-auth"

export const auth = betterAuth({
  database: {
    provider: "sqlite",
    client: {
      execute: async (query: string, params: unknown[], ctx: { env: { DB: D1Database } }) => {
        const stmt = ctx.env.DB.prepare(query)
        const result = await stmt.bind(...params).all()
        return result
      }
    }
  },

  emailAndPassword: {
    enabled: true
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7 // 7 days
  },

  // 允许站点跨域登录（前端与 Workers 不同域名时必配）
  trustedOrigins: [
    "http://localhost:3000",
    "https://hexi.men",
    "https://2437951611.workers.dev",
  ],
})