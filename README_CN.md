# BLOGIT

[English](./README.md) | [中文](./README_CN.md)

<h1 align="center">A Git-powered, local-first blogging system</h1>

- **Content as code**：内容就是代码，文章是你仓库里的 Markdown 文件。
- **Publishing as push**：发布就是推送，直接走现有的 Git/CI/CD 流程。
- **Cloneable and forkable**：可克隆、可 Fork，整套博客系统可迁移、可复现。
- **No platform lock-in**：没有平台锁定，不依赖第三方图床。
- **SEO optimized by default**：基于 SSG 静态生成，并内置 `metadata`、`sitemap.xml` 与 `robots.txt`，默认面向搜索引擎友好。
- **Visual admin panel**：提供博客后台管理系统，支持 Markdown Block 级编辑，非技术用户也能轻松写作和管理内容。

## 预览地址

- Admin 预览地址：[https://blogit-admin.pages.dev](https://blogit-admin.pages.dev)
- Admin 密码：`blogit123456`
- Blog 预览地址：[https://blogit-blog.2437951611.workers.dev](https://blogit-blog.2437951611.workers.dev)

## 快速开始

### 1. Use this template

点击 [Use this template](https://github.com/new?template_name=Blogit&template_owner=Hexi1997) 根据 Blogit 模板创建你自己的仓库（Public），然后克隆到本地并安装依赖。

### 2. 修改 [config.ts](apps/admin/src/lib/config.ts) 中的仓库配置

修改成上一步创建的仓库的 owner 和 repo name。

### 3. 生成 GitHub PAT 并初始化 Admin 本地变量

生成一个有只有当前仓库 `Contents Read And Write` 权限的 [GitHub fine-grained personal access tokens ](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)，复制 [.dev.vars.example](apps/admin/.dev.vars.example) 到 `.dev.vars`：

然后在 `.dev.vars` 中更新：
  - `ADMIN_PAT=<your_github_pat>`
  - `ADMIN_PASSWORD_HASH=<sha256_of_password>`（可访问 https://emn178.github.io/online-tools/sha256.html 生成）

### 4. 配置 Giscus 评论区并写入 Blog 环境变量
> Giscus 环境变量可选，不配置就不显示评论区

在仓库[开启 Discussions](https://docs.github.com/en/discussions/quickstart#enabling-github-discussions-on-your-repository) 并安装 [Giscus App](https://github.com/apps/giscus)，网页访问 [giscus.app](https://giscus.app) 生成参数，写入 [.env](apps/blog/.env)：
  - `NEXT_PUBLIC_GISCUS_REPO`
  - `NEXT_PUBLIC_GISCUS_REPO_ID`
  - `NEXT_PUBLIC_GISCUS_CATEGORY`
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID`

### 5. 配置 Github Action 环境变量

登录 `Cloudflare` 后台，创建 `Account API Token`（由 `Edit Cloudflare Workers` 模板创建即可，需要对应权限）并获取 `Account ID`。

在仓库 `Settings -> Secrets and variables -> Actions -> Repository secrets` 中配置如下变量：
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
  - `ADMIN_PAT`
  - `ADMIN_PASSWORD_HASH`

### 6. Commit and Push

  - 提交所有修改到 Github
  - Github 流水线跑完以后可以在 `Cloudflare Workers and Pages` 看到 `blogit-admin` 和 `blogit-blog` 两个项目的部署地址
  - 获取 `blogit-blog` 项目的部署地址并更新到 [.env](apps/blog/.env) 的 `NEXT_PUBLIC_SITE_URL`

## 项目介绍

### 1. 简介
Blogit 是一个基于 pnpm monorepo 的 Markdown 博客系统，包含两个应用：

- `apps/blog`：面向读者的博客站点，技术栈是 Next.js 16（App Router），通过 OpenNext 部署到 Cloudflare。
- `apps/admin`：后台管理端，支持博客可视化增删改查。技术栈是 React + Vite + Cloudflare Pages Functions，通过 GitHub Git Data API 直接写入博客内容。

### 2. 项目内容

- 博客正文来源：`apps/blog/posts/<slug>/index.md`
- 文章资源文件：`apps/blog/posts/<slug>/assets/`*
- 列表索引缓存：[apps/blog/posts/_index.json](apps/blog/posts/_index.json)
- Blog 能力：
  - SSG 静态页面
  - SEO（`sitemap.xml`、`robots.txt`、metadata）
  - Giscus 评论
  - KaTeX 数学公式、Shiki 代码高亮、代码复制、图片预览增强
  - Tag 系统
- Admin 能力：
  - 密码登录
  - 文章列表 / 新建 / 编辑 / 删除
  - 原子化提交（正文 + 图片 + `_index.json` 同一次 commit）

## 目录结构

```text
├── apps/
│   ├── blog/                  # 对外博客
│   │   ├── app/
│   │   ├── posts/             # Markdown 内容源
│   │   ├── public/
│   │   └── scripts/
│   └── admin/                 # 后台
├── package.json
└── pnpm-workspace.yaml
```

## 安装依赖

```bash
pnpm install
```

## 本地开发

### 1. 同时启动两个应用

```bash
pnpm dev
```

### 2. 单独启动

```bash
pnpm dev:blog
pnpm dev:admin
```

常见本地地址：

- Blog：`http://localhost:3000`
- Admin：由 Wrangler Pages dev 输出（`http://localhost:8788`）

## 博客内容管理

### 1. 目录结构

```text
apps/blog/posts/<slug>/
├── index.md
└── assets/
```

### 2. Frontmatter 示例

Frontmatter 示例：

```yaml
---
title: "文章标题"
date: "2026-03-05"
pinned: true # 可选，置顶文章会排在普通文章前面
cover: "assets/cover.webp"
tags:
  - nextjs
  - cloudflare
source: "https://example.com/original-link" # 可选，外链文章
---
```

### 3. 字段说明

- **title** (必需)：文章标题
- **date** (必需)：发布日期，格式：YYYY-MM-DD
- **pinned** (可选)：是否置顶文章。置顶文章会排在非置顶文章前面；如果有多篇置顶文章，它们之间仍然按日期倒序排列。
- **cover** (可选)：封面图片路径，支持相对路径（如 `assets/cover.jpg`）或外部 URL（如 `https://example.com/image.jpg`）。如果未设置，系统会自动提取 markdown 内容中的第一张图片作为封面；如果内容中没有图片，则使用占位图 `/default-cover.png`
- **source** (可选)：外部文章链接。当设置此字段时，点击博客列表中的文章会直接跳转到该外部链接（新标签页打开），而不是内部博客详情页。在博客详情页底部也会显示来源链接。适用于引用第三方内容的场景
- **tags** (可选)：文章标签。支持 YAML 数组格式，例如 `tags: ["nextjs", "react"]` 或多行列表写法

> **重要提示：** 网站不会主动抓取外部链接的内容。但是博客列表中的需要显示内容摘要/描述，因此您必须在 `index.md` 文件的正文中手动补充内容。系统会从 markdown 内容中提取文本，生成显示在博客卡片上的描述信息。

### 4. 索引与资源同步


- `pnpm --filter blog run generate-index`：重建 `posts/_index.json`([流水线](.github/workflows/sync-post-index.yml)自动执行，无需本地手动执行）
- `pnpm --filter blog run sync-assets`：同步 `posts/*/assets` 到 `public/blog-assets`([流水线](.github/workflows/deploy-blog.yml)自动执行，无需本地手动执行）

## 许可证

MIT License，见 [LICENSE](./LICENSE)。
