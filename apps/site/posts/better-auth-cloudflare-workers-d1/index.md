---
title: '把 Better Auth 跑在 Cloudflare Workers + D1 上踩了哪些坑'
date: '2026-03-17'
---

最近在给自己的站点接入用户系统，技术栈是 **Cloudflare Workers（Hono）+ D1 + Better Auth**。本以为照着文档走一遍就行，结果一路踩了三个连环坑，每个坑都有独立的报错，记录一下排查过程。

---

## 坑一：注册/登录线上 503，本地完全正常

这是最难受的一个坑，因为本地开发一切正常，推上线就 503，让人摸不着头脑。

**报错（wrangler tail）**

```
Error: Worker exceeded CPU time limit.
```

**原因：scrypt 是 CPU 杀手**

Better Auth 默认用 **scrypt** 做密码哈希。scrypt 由 Colin Percival 在 2009 年设计，核心目标就是让暴力破解在计算资源上代价极高——它同时消耗大量 CPU 和内存，即便是现代 GPU 也很难并行加速。

这个特性在传统服务器上是优点，但在 **Cloudflare Workers** 上就成了致命问题：

- Workers 免费套餐单次请求 CPU 时限只有 **10ms**（付费套餐也只有 30ms）
- scrypt 在 Node.js 上跑一次密码哈希通常需要 **100–300ms** 的 CPU 时间
- 结果是：本地 `wrangler dev` 跑在 Node.js 进程里，没有 CPU 时限，正常；部署到真实 Workers 运行时，直接超限 503

这也解释了为什么 `get-session`（不涉及密码哈希）没问题，只有 `sign-up` 和 `sign-in` 会炸。

**第一次尝试：PBKDF2，但迭代数踩了另一个坑**

Better Auth 的 `emailAndPassword` 支持传入自定义 `password.hash` / `password.verify`，于是打算换成 Web Crypto API 的 PBKDF2——它是标准算法，Workers 原生支持，CPU 消耗也比 scrypt 低得多。

一开始照着 NIST 推荐设了 200,000 次迭代：

```
NotSupportedError: Pbkdf2 failed: iteration counts above 100000
are not supported (requested 200000).
```

Cloudflare Workers 的 Web Crypto 实现对 PBKDF2 迭代次数有硬性上限：**100,000 次**。这个限制在官方文档里几乎没有提及，只能从报错里发现。

**最终修复：PBKDF2，100,000 次迭代**

用 Web Crypto API 实现完整的 hash / verify，接入 Better Auth 的自定义密码钩子：

```ts
const enc = new TextEncoder()

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function fromHex(hex: string) {
  return new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
}

const password = {
  hash: async (plain: string) => {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(plain), "PBKDF2", false, ["deriveBits"]
    )
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
      key, 256,
    )
    return `pbkdf2:${toHex(salt.buffer)}:${toHex(bits)}`
  },
  verify: async ({ hash, password: plain }: { hash: string; password: string }) => {
    const [, saltHex, hashHex] = hash.split(":")
    const salt = fromHex(saltHex)
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(plain), "PBKDF2", false, ["deriveBits"]
    )
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

格式约定为 `pbkdf2:<saltHex>:<hashHex>`，salt 每次随机生成，verify 时从存储值里解析出来重新派生对比。

> **注意**：切换哈希算法后，数据库里用 scrypt 存储的旧密码无法通过新的 verify，需要清空用户表让用户重新注册（或做一次哈希格式迁移）。

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

```ts
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  // ...
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(), // 👈
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(), // 👈
})
```

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

## 总结

| 坑 | 根因 | 关键词 |
|---|---|---|
| 线上 503 | scrypt 超 CPU 时限；PBKDF2 超 Workers 迭代上限 | Web Crypto PBKDF2 100k |
| D1 拒绝 Date 对象 | `text` 列无法接收 JS Date | `integer timestamp` mode |
| 线上 500 | Workers 无 `process.env`，且缺少 `baseURL`/`secret` | env bindings |

Cloudflare Workers 的 Edge 运行时和 Node.js 差异比想象中大，尤其是 **CPU 时限**和 **Web Crypto API 的隐性限制**，用任何涉及密码学运算的库之前都值得先查一下兼容性。
