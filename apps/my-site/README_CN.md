# WORLD3 Blog

[English](README.md) | [中文](README_CN.md)

一个基于 Next.js 16 的现代化博客系统，支持 SSG（静态网站生成）、完整的 SEO 优化和简单的 Markdown 内容管理。

## ✨ 特性

- 🚀 **Next.js 16** - 使用最新的 App Router 和 React 19
- ⚡ **Turbopack** - 启用系统 TLS 证书支持，更快的开发体验
- 📝 **Markdown 内容管理** - 市场人员可以轻松编辑 Markdown 文件
- 🎨 **现代化 UI** - 使用 Tailwind CSS 构建的美观界面
- 🔍 **SEO 优化** - 自动生成 sitemap、robots.txt 和完整的 meta 标签
- ⚡ **SSG 静态生成** - 超快的页面加载速度
- 🏷️ **分类系统** - 基于分类的文章组织和相关推荐
- 📱 **响应式设计** - 完美支持移动端和桌面端

## 🗂️ 文章管理

[/blogs](/blogs) 这个目录包含所有博客文章，每篇文章有独立的文件夹。

> **说明**：目前 WORLD3 的博客主要是官方 Medium（[https://medium.com/@WORLD3_AI](https://medium.com/@WORLD3_AI)）的备份。可以通过 [https://github.com/WhiteMatrixTech/world3-medium-converter](https://github.com/WhiteMatrixTech/world3-medium-converter) 提供的工具将 Medium 文章转换成博客需要的数据格式。

### 文件格式

每篇博客文章都在独立的文件夹中，文件夹名将作为 URL slug：

```
blogs/
├── my-blog-post/          # slug: my-blog-post
│   ├── index.md           # 博客内容
│   └── assets/            # 所有资源文件
│       ├── cover.jpg      # 封面图
│       ├── screenshot.png # 文章内图片
│       └── diagram.svg    # 其他资源
└── another-post/          # slug: another-post
    ├── index.md
    └── assets/
        └── cover.jpg
```

### 字段说明

- **title** (必需)：文章标题
- **date** (必需)：发布日期，格式：YYYY-MM-DD
- **cover** (可选)：封面图片路径，支持相对路径（如 `assets/cover.jpg`）或外部 URL（如 `https://example.com/image.jpg`）。如果未设置，系统会自动提取 markdown 内容中的第一张图片作为封面；如果内容中没有图片，则使用占位图 `/default-cover.webp`
- **category** (可选)：文章分类，默认为 `Company`，用于内容分类
- **sortIndex** (可选)：排序权重，默认为 0。值越大，文章显示越靠前。相同 sortIndex 的文章按日期降序排序
- **source** (可选)：外部文章链接。当设置此字段时，点击博客列表中的文章卡片会直接跳转到该外部链接（新标签页打开），而不是内部博客详情页。在博客详情页底部也会显示来源链接。适用于引用第三方内容的场景

### 内容管理建议

2. **图片优化**：压缩图片以提高加载速度
3. **分类使用**：使用一致的分类系统，便于内容组织

### 添加新文章

1. 在此目录下创建新的文件夹（文件夹名即为 URL slug）
2. 在文件夹内创建 `index.md` 和 `assets/` 文件夹
3. 添加 frontmatter 元数据
4. 将封面图和其他资源放在 `assets/` 文件夹
5. 保存并提交到 Git
6. 部署后，文章会自动出现在博客列表中

**外链博客示例（source 类型）：**

如果你想链接到外部文章而不是托管完整内容，可以在 frontmatter 中添加 `source` 字段：

```markdown
---
title: "我们在 X 上的最新公告"
date: "2025-01-20"
cover: "https://example.com/cover.jpg"
category: "Product"
source: "https://x.com/WORLD3_AI/status/1234567890"
---

在 X（Twitter）上阅读完整公告。
```

当用户在列表中点击该博客卡片时，会直接跳转到外部链接。

> **重要提示：** 网站不会主动抓取外部链接的内容。但是博客列表中的卡片需要显示内容摘要/描述，因此您必须在 `index.md` 文件的正文中手动补充内容。系统会从 markdown 内容中提取文本，生成显示在博客卡片上的描述信息。

### 排序规则

文章排序遵循以下规则：

1. **首先按 sortIndex 降序排序**：sortIndex 值越大，文章显示越靠前
2. **然后按日期降序排序**：sortIndex 相同时，最新的文章显示在前

示例：

- 文章 A：sortIndex = 10, date = "2025-12-01"
- 文章 B：sortIndex = 5, date = "2025-12-15"
- 文章 C：sortIndex = 5, date = "2025-12-10"
- 文章 D：sortIndex = 0, date = "2025-12-20"

显示顺序：A → B → C → D

> **置顶标签**：排序后的前 4 篇文章会在博客卡片上自动显示 "Pinned" 标签，使其在列表中更加醒目。

### Discord 通知

当新的博客文章被添加到 `main` 分支时，系统会在**生产环境部署成功后**自动向配置的 Discord 频道发送通知消息。这样可以确保 Discord 能够正确抓取博客的 SEO 元数据（标题、描述、og:image），显示完整的富文本预览卡片。


- 通知逻辑已整合到生产环境部署工作流中
- 部署成功后，系统通过检测新添加的 `index.md` 文件自动识别新博客
- 部署完成后等待 30 秒，确保部署完全生效后再发送通知
- 仅通知新博客（已存在的博客和修改操作会被忽略）
- 不会重复通知 - 每个博客仅在首次添加时通知一次
- 通知内容包含完整的博客 URL 及富文本预览：`https://blog.world3.ai/blog/{slug}`
