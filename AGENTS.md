# AGENTS.md

## Cursor Cloud specific instructions

### Overview

HEXI SPACE is a personal blogging platform in a **pnpm monorepo** (`pnpm@10.30.0`, Node.js 22.x) with two apps under `apps/`:

| App | Framework | Dev Command | Port | Description |
|-----|-----------|-------------|------|-------------|
| `site` | Next.js 16 (React 19) | `pnpm dev:site` | 3000 | Public blog (reads Markdown from `apps/site/posts/`) |
| `admin` | Vite 7 + React 19 + Wrangler | `pnpm dev:admin` | 8788 | Admin dashboard (uses GitHub API via Octokit) |

### Scripts

All standard dev/build/lint/test commands are in the root `package.json`. Key ones:

- `pnpm dev` — starts both apps in parallel
- `pnpm dev:site` / `pnpm dev:admin` — starts one app
- `pnpm build` — builds both apps
- `pnpm --filter site run lint` / `pnpm --filter admin run lint` — lint per app

### Caveats

- The admin app dev server uses `wrangler pages dev -- vite`, which requires a `.dev.vars` file in `apps/admin/`. Copy from `.dev.vars.example` for local dev. Without real credentials (GitHub PAT + password hash), the admin login won't authenticate, but the UI and dev server still run.
- The admin `eslint` has a pre-existing error (`react-refresh/only-export-components` in `badge.tsx`). This is not a blocker for development.
- The site app's `next.config.ts` sets `turbopack.root` to `../..` (monorepo root). This is required for the monorepo structure and should not be changed.
- Blog content lives as Markdown files in `apps/site/posts/*/index.md`. The site reads them at build/render time from the filesystem (no database needed).
