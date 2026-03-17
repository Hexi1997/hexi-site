import { betterAuth } from "better-auth"
import { drizzle } from "drizzle-orm/d1"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { ALLOWED_ORIGINS } from "../constants"
import * as schema from "../schema"

type EnvWithD1 = {
  hexi_site: D1Database
  BETTER_AUTH_URL: string
  BETTER_AUTH_SECRET: string
}

export const createAuth = (env: EnvWithD1) =>
  betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(drizzle(env.hexi_site), {
      provider: "sqlite",
      schema,
    }),

    emailAndPassword: {
      enabled: true,
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
    },

    // 允许站点跨域登录（前端与 Workers 不同域名时必配）
    trustedOrigins: ALLOWED_ORIGINS,
  })