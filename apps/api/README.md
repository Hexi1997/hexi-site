```txt
pnpm install
cp .dev.vars.example .dev.vars
pnpm run dev
```

For local development, `wrangler dev` now uses the local D1 database by default. Apply migrations locally before first run:

```txt
wrangler d1 migrations apply hexi-site --local
```

If you also run the site app locally, create `apps/site/.env.local` from `apps/site/.env.local.example` so the browser talks to the local API at `http://localhost:8787`.

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
