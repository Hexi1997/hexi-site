import { betterAuth } from "better-auth"
import { ALLOWED_ORIGINS } from "../constants"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
  database: {
    provider: "sqlite",
    client: {
      execute: async (query: string, params: unknown[], ctx: { env: { hexi_site: D1Database } }) => {
        const stmt = ctx.env.hexi_site.prepare(query)
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
    trustedOrigins: ALLOWED_ORIGINS,
  })