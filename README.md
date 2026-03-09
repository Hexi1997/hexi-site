# BLOGIT

[English](./README.md) | [中文](./README_CN.md)

<h1 align="center">A Git-powered, local-first blogging system</h1>

- **Content as code**: content is code, and posts are Markdown files in your repository.
- **Publishing as push**: publishing is pushing, directly through your existing Git/CI/CD workflow.
- **Cloneable and forkable**: cloneable and forkable, the whole blogging system is portable and reproducible.
- **No platform lock-in**: no platform lock-in and no dependency on third-party image hosting.
- **SEO optimized by default**: powered by SSG static generation, with built-in `metadata`, `sitemap.xml`, and `robots.txt` for search-engine friendliness.
- **Visual admin panel**: includes an admin system with Markdown block-level editing, so non-technical users can also write and manage content easily.

## Preview

- Admin preview: [https://blogit-admin.pages.dev](https://blogit-admin.pages.dev)
- Admin password: `blogit123456`
- Blog preview: [https://blogit-blog.2437951611.workers.dev](https://blogit-blog.2437951611.workers.dev)

## Quick Start

### 1. Use this template

Click [Use this template](https://github.com/new?template_name=Blogit&template_owner=Hexi1997) to create your own repository (Public) from the Blogit template, then clone it locally and install dependencies.

### 2. Update repo config in [config.ts](apps/admin/src/lib/config.ts)

Change it to the owner and repo name of the repository created in step 1.

### 3. Generate a GitHub PAT and initialize local Admin variables

Create a [GitHub fine-grained personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token) with `Contents: Read and write` permission for the current repository only, then copy [.dev.vars.example](apps/admin/.dev.vars.example) to `.dev.vars`:

Then update values in `.dev.vars`:
  - `ADMIN_PAT=<your_github_pat>`
  - `ADMIN_PASSWORD_HASH=<sha256_of_password>` (you can generate it at https://emn178.github.io/online-tools/sha256.html)

### 4. Configure Giscus comments and write Blog env vars
> Giscus env vars are optional. If not configured, the comment area will not be shown.

Enable [Discussions](https://docs.github.com/en/discussions/quickstart#enabling-github-discussions-on-your-repository) in your repo and install [Giscus App](https://github.com/apps/giscus), then visit [giscus.app](https://giscus.app) to generate parameters and write them into [.env](apps/blog/.env):
  - `NEXT_PUBLIC_GISCUS_REPO`
  - `NEXT_PUBLIC_GISCUS_REPO_ID`
  - `NEXT_PUBLIC_GISCUS_CATEGORY`
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID`

### 5. Configure GitHub Action environment variables

Log in to Cloudflare, create an `Account API Token` (the `Edit Cloudflare Workers` template is enough with proper permissions), and get your `Account ID`.

In your repository at `Settings -> Secrets and variables -> Actions -> Repository secrets`, configure:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `ADMIN_PAT`
  - `ADMIN_PASSWORD_HASH`

### 6. Commit and Push

  - Commit all changes to GitHub.
  - After GitHub workflows finish, you can find deployment URLs for `blogit-admin` and `blogit-blog` under `Cloudflare Workers and Pages`.
  - Get the deployment URL of `blogit-blog` and update `NEXT_PUBLIC_SITE_URL` in [.env](apps/blog/.env).

## Project Overview

### 1. Introduction
Blogit is a pnpm monorepo Markdown blog system with two applications:

- `apps/blog`: reader-facing blog site, built with Next.js 16 (App Router), deployed to Cloudflare via OpenNext.
- `apps/admin`: admin application for visual blog CRUD operations. Built with React + Vite + Cloudflare Pages Functions, and writes content directly via GitHub Git Data API.

### 2. Project Content

- Post source of truth: `apps/blog/posts/<slug>/index.md`
- Post assets: `apps/blog/posts/<slug>/assets/`*
- Post index cache: [apps/blog/posts/_index.json](apps/blog/posts/_index.json)
- Blog capabilities:
  - SSG static pages
  - SEO (`sitemap.xml`, `robots.txt`, metadata)
  - Giscus comments
  - KaTeX math, Shiki code highlighting, code copy, image preview enhancement
  - Tag system
- Admin capabilities:
  - Password login
  - Post list / create / edit / delete
  - Atomic commit (content + images + `_index.json` in one commit)

## Directory Structure

```text
├── apps/
│   ├── blog/                  # Public blog
│   │   ├── app/
│   │   ├── posts/             # Markdown source of truth
│   │   ├── public/
│   │   └── scripts/
│   └── admin/                 # Admin
├── package.json
└── pnpm-workspace.yaml
```

## Install Dependencies

```bash
pnpm install
```

## Local Development

### 1. Start both apps

```bash
pnpm dev
```

### 2. Start individually

```bash
pnpm dev:blog
pnpm dev:admin
```

Common local URLs:

- Blog: `http://localhost:3000`
- Admin: printed by Wrangler Pages dev (`http://localhost:8788`)

## Blog Content Management

### 1. Directory Structure

```text
apps/blog/posts/<slug>/
├── index.md
└── assets/
```

### 2. Frontmatter Example

Frontmatter example:

```yaml
---
title: "Post title"
date: "2026-03-05"
pinned: true # optional, pinned posts are sorted before regular posts
cover: "assets/cover.webp"
tags:
  - nextjs
  - cloudflare
source: "https://example.com/original-link" # optional external link post
---
```

### 3. Field Descriptions

- **title** (required): post title
- **date** (required): publish date, format: YYYY-MM-DD
- **pinned** (optional): whether the post is pinned. Pinned posts are sorted before non-pinned posts; when multiple posts are pinned, they are still ordered by date descending.
- **cover** (optional): cover image path; supports relative paths (for example, `assets/cover.jpg`) or external URLs (for example, `https://example.com/image.jpg`). If missing, the system tries the first image in markdown; if none exists, it falls back to `/default-cover.png`.
- **source** (optional): external article URL. If set, clicking the card in the list redirects directly to this external URL (opens in a new tab), instead of the internal post detail page. The source link is also shown at the bottom of the post detail page. Useful for third-party content references.
- **tags** (optional): post tags. Supports YAML array format, for example `tags: ["nextjs", "react"]` or multiline list format.

> **Important:** The site does not fetch content from external links automatically. The blog list still needs summary/description text, so you must provide content in the `index.md` body manually. The system extracts text from markdown and generates the card description.

### 4. Index and Asset Sync

- `pnpm --filter blog run generate-index`: rebuild `posts/_index.json` (automatically handled by [workflow](.github/workflows/sync-post-index.yml), no manual local run needed)
- `pnpm --filter blog run sync-assets`: sync `posts/*/assets` to `public/blog-assets` (automatically handled by [workflow](.github/workflows/deploy-blog.yml), no manual local run needed)

## License

MIT License, see [LICENSE](./LICENSE).
