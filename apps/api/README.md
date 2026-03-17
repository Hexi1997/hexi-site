```txt
pnpm install
pnpm run dev
```

## Deploy

```txt
pnpm run deploy
```

## DB

```txt
pnpm run db:generate   # drizzle-kit generate
pnpm run db:migrate    # apply migrations to remote D1
```

## Types

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
pnpm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiating `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
