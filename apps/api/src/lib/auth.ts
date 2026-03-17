import { betterAuth } from "better-auth"
import { drizzle } from "drizzle-orm/d1"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { ALLOWED_ORIGINS } from "../constants"
import * as schema from "../schema"

type EnvWithD1 = {
  hexi_site: D1Database
  BETTER_AUTH_URL: string
  BETTER_AUTH_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GH_CLIENT_ID: string
  GH_CLIENT_SECRET: string
}

const enc = new TextEncoder()

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function fromHex(hex: string) {
  const arr = hex.match(/.{2}/g)!.map((b) => parseInt(b, 16))
  return new Uint8Array(arr)
}

// PBKDF2-based password hashing — much lighter on CPU than scrypt/bcrypt,
// safe to use within Cloudflare Workers' CPU time budget.
const password = {
  hash: async (plain: string) => {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const key = await crypto.subtle.importKey("raw", enc.encode(plain), "PBKDF2", false, ["deriveBits"])
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
      key,
      256,
    )
    return `pbkdf2:${toHex(salt.buffer)}:${toHex(bits)}`
  },
  verify: async ({ hash, password: plain }: { hash: string; password: string }) => {
    const [, saltHex, hashHex] = hash.split(":")
    const salt = fromHex(saltHex)
    const key = await crypto.subtle.importKey("raw", enc.encode(plain), "PBKDF2", false, ["deriveBits"])
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
      key,
      256,
    )
    return toHex(bits) === hashHex
  },
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
      password,
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId: env.GH_CLIENT_ID,
        clientSecret: env.GH_CLIENT_SECRET,
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
    },

    // 允许站点跨域登录（前端与 Workers 不同域名时必配）
    trustedOrigins: ALLOWED_ORIGINS,
  })