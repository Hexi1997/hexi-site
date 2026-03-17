---
title: '把 Better Auth 跑在 Cloudflare Workers + D1 上踩了哪些坑'
date: '2026-03-17'
---

最近在给自己的站点接入用户系统，技术栈是 **Cloudflare Workers（Hono）+ D1 + Better Auth**。本以为照着文档走一遍就行，结果一路踩了四个连环坑，每个坑都有独立的报错，记录一下排查过程。

---

## 坑一：Drizzle Adapter 找不到 `user` 模型

**报错**

```
BetterAuthError: [# Drizzle Adapter]: The model "user" was not found
in the schema object. Please pass the schema directly to the adapter options.
```

**原因**

Better Auth 的 Drizzle Adapter 需要拿到 TypeScript 的 schema 对象才能做表名映射，光传 `drizzle(db)` 实例是不够的。

项目里虽然有 `.sql` 建表文件，但没有对应的 Drizzle TypeScript schema。

**修复**

新建 `src/schema/index.ts`，用 `drizzle-orm/sqlite-core` 定义 Better Auth 所需的四张表，然后传给 adapter：

```ts
// src/schema/index.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})
// ... session / account / verification 同理
```

```ts
// src/lib/auth.ts
import * as schema from "../schema"

database: drizzleAdapter(drizzle(env.hexi_site), {
  provider: "sqlite",
  schema,          // 👈 关键：把 schema 显式传进来
}),
```

---

## 坑二：D1 拒绝 Date 对象插入

**报错**

```
D1_TYPE_ERROR: Type 'object' not supported for
value 'Tue Mar 17 2026 14:45:55 GMT+0800'
```

**原因**

Better Auth 向 D1 传入的是 JavaScript `Date` 对象。如果 Drizzle schema 里把日期字段定义为 `text`，Drizzle 不会做任何序列化，D1 直接拒绝 `object` 类型。

**修复**

把所有日期字段从 `text("createdAt")` 改为 `integer("createdAt", { mode: "timestamp" })`。Drizzle 会自动把 `Date` 转成 Unix 时间戳（整数）写入 SQLite，读取时再还原成 `Date`。

同时把 `.sql` 建表文件里对应列从 `TEXT` 改成 `INTEGER`，并在远端 D1 上重建表。

---

## 坑三：部署到线上后 `get-session` 返回 500

**现象**

本地 `wrangler dev`（`"remote": true` 直连线上 D1）完全正常，部署到 Workers 之后所有 `/api/auth/*` 接口返回 500。

**原因**

`auth.ts` 里 `baseURL` 和 `secret` 被注释掉了：

```ts
// baseURL: process.env.BETTER_AUTH_URL,
// secret: process.env.BETTER_AUTH_SECRET,
```

Better Auth 在 Node.js 环境可以自动推断 `baseURL`，但在 Cloudflare Workers 运行时里无法感知请求域名，必须显式配置。另外 **Workers 没有 `process.env`**，即使取消注释也读不到值。

**修复**

通过 Workers env bindings 传入这两个值：

```ts
type EnvWithD1 = {
  hexi_site: D1Database
  BETTER_AUTH_URL: string
  BETTER_AUTH_SECRET: string
}

export const createAuth = (env: EnvWithD1) =>
  betterAuth({
    baseURL: env.BETTER_AUTH_URL,   // 👈 从 env 读取
    secret: env.BETTER_AUTH_SECRET,
    ...
  })
```

`wrangler.jsonc` 配置明文变量：

```jsonc
"vars": {
  "BETTER_AUTH_URL": "https://api.your-worker.workers.dev"
}
```

`BETTER_AUTH_SECRET` 是敏感值，用 wrangler secret 上传，不进 git：

```bash
openssl rand -base64 32 | npx wrangler secret put BETTER_AUTH_SECRET
```

---

## 坑四：注册/登录线上 503，本地正常

**报错（wrangler tail）**

```
Error: Worker exceeded CPU time limit.
```

**原因**

Better Auth 默认用 **scrypt** 做密码哈希。scrypt 是故意设计成 CPU/内存密集型的，在本地 Node.js 跑没问题，但 Cloudflare Workers 免费套餐的单次请求 CPU 时限是 **10ms**，scrypt 远远超出。

**第一次尝试**：换成 PBKDF2，迭代次数设为 200,000：

```
NotSupportedError: Pbkdf2 failed: iteration counts above 100000
are not supported (requested 200000).
```

Workers 的 Web Crypto API 上限是 **100,000 次**。

**最终修复**

用 Web Crypto API 的 PBKDF2（100,000 次迭代，SHA-256）替换默认的 scrypt：

```ts
const enc = new TextEncoder()

const password = {
  hash: async (plain: string) => {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const key = await crypto.subtle.importKey("raw", enc.encode(plain), "PBKDF2", false, ["deriveBits"])
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
      key, 256,
    )
    return `pbkdf2:${toHex(salt.buffer)}:${toHex(bits)}`
  },
  verify: async ({ hash, password: plain }) => {
    const [, saltHex, hashHex] = hash.split(":")
    const salt = fromHex(saltHex)
    const key = await crypto.subtle.importKey("raw", enc.encode(plain), "PBKDF2", false, ["deriveBits"])
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
      key, 256,
    )
    return toHex(bits) === hashHex
  },
}

betterAuth({
  emailAndPassword: {
    enabled: true,
    password,  // 👈 替换默认 scrypt
  },
  ...
})
```

由于哈希算法变了，数据库里用 scrypt 哈希的旧密码无法验证，需要清空用户表重新注册。

---

## 总结

| 坑 | 根因 | 关键词 |
|---|---|---|
| Drizzle Adapter 找不到模型 | 未传 schema 对象给 adapter | `schema` option |
| D1 拒绝 Date 对象 | `text` 列无法接收 JS Date | `integer timestamp` mode |
| 线上 500 | Workers 无 `process.env`，且缺少 `baseURL`/`secret` | env bindings |
| 线上 503 | scrypt 超 CPU 时限，PBKDF2 超迭代上限 | Web Crypto PBKDF2 100k |

Cloudflare Workers 的运行时和 Node.js 差异比想象中大，尤其是 **CPU 时限**和 **Web Crypto API 限制**，用任何涉及密码学运算的库之前都值得先查一下兼容性。
