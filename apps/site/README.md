# Hexi Blog

[English](README.md) | [中文](README_CN.md)

A modern blog system built on Next.js 16, supporting SSG (Static Site Generation), complete SEO optimization, and simple Markdown content management.

## ✨ Features

- 🚀 **Next.js 16** - Uses the latest App Router and React 19
- ⚡ **Turbopack** - System TLS certificate support enabled for faster development experience
- 📝 **Markdown Content Management** - Marketing teams can easily edit Markdown files
- 🎨 **Modern UI** - Beautiful interface built with Tailwind CSS
- 🔍 **SEO Optimized** - Auto-generates sitemap, robots.txt, and complete meta tags
- ⚡ **SSG Static Generation** - Ultra-fast page loading speeds
- 📱 **Responsive Design** - Perfect support for mobile and desktop

## 🗂️ Content Management

The [/posts](/posts) directory contains all blog posts, with each post in its own folder.

### File Structure

Each blog post is in a separate folder, and the folder name serves as the URL slug:

```
posts/
├── my-blog-post/          # slug: my-blog-post
│   ├── index.md           # Blog content
│   └── assets/            # All resource files
│       ├── cover.jpg      # Cover image
│       ├── screenshot.png # Images in article
│       └── diagram.svg    # Other resources
└── another-post/          # slug: another-post
    ├── index.md
    └── assets/
        └── cover.jpg
```

### Field Descriptions

- **title** (required): Article title
- **date** (required): Publication date, format: YYYY-MM-DD
- **cover** (optional): Cover image path, supports relative paths (e.g., `assets/cover.jpg`) or external URLs (e.g., `https://example.com/image.jpg`). If not set, the system will automatically extract the first image from the markdown content as the cover; if there are no images in the content, it will use the placeholder image `/default-og-image.webp`
- **sortIndex** (optional): Sort weight, default is 0. Higher values appear first. Articles with the same sortIndex are sorted by date in descending order
- **source** (optional): External article URL. When set, clicking the blog card in the list will navigate directly to this external URL (opens in a new tab) instead of the internal blog detail page. The source link will also be displayed at the bottom of the blog detail page. This is useful for linking to third-party content

### Content Management Tips

1. **Image Optimization**: Compress images to improve loading speed

### Adding New Posts

1. Create a new folder in this directory (folder name becomes the URL slug)
2. Create `index.md` and `assets/` folder inside
3. Add frontmatter metadata
4. Place cover images and other resources in the `assets/` folder
5. Save and commit to Git
6. After deployment, the article will automatically appear in the blog list

**Example for external link blog (source type):**

If you want to link to an external article instead of hosting the full content, add the `source` field in frontmatter:

```markdown
---
title: "Our Latest Announcement on X"
date: "2025-01-20"
cover: "https://example.com/cover.jpg"
source: "https://x.com/WORLD3_AI/status/1234567890"
---

Read the full announcement on X (Twitter).
```

When users click this blog card in the list, they will be redirected to the external URL directly.

> **Important Note:** The website does not automatically fetch content from external URLs. However, blog cards in the list display a content summary/description. You must manually provide this content in the `index.md` file body. The system will extract text from the markdown content to generate the description shown on the blog card.

### Sorting Rules

Article sorting follows these rules:

1. **First sort by sortIndex in descending order**: Higher sortIndex values appear first
2. **Then sort by date in descending order**: When sortIndex is the same, newest articles appear first

Example:

- Article A: sortIndex = 10, date = "2025-12-01"
- Article B: sortIndex = 5, date = "2025-12-15"
- Article C: sortIndex = 5, date = "2025-12-10"
- Article D: sortIndex = 0, date = "2025-12-20"

Display order: A → B → C → D

