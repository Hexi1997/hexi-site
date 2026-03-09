---
title: 'Markdown Syntax Showcase'
date: '2026-03-06'
tags:
  - 'Blogit'
  - 'Markdown Preview'
---

This post demonstrates common Markdown capabilities supported by Blogit, including headings, lists, links, blockquotes, code blocks, tables, images, and LaTeX.

## Headings

### Level 3 Heading

#### Level 4 Heading

You can write **bold text**, *italic text*, ***bold italic text***, ~~strikethrough~~, and inline code like `const title = "Blogit";`.

## Links

* [OpenAI](https://openai.com)

* [GitHub](https://github.com)

* <https://blogit.dev>

## Lists

### Unordered List

* Write locally

* Track changes with Git

* Publish with CI/CD

### Ordered List

1. Create a post folder
2. Add an `index.md`
3. Commit and push

### Task List

* [x] Markdown support

* [x] Code highlighting

* [x] LaTeX rendering

* [ ] More demo components

## Quote

> Own your content.
>
> Platforms can distribute it, but they should not control it.

## Image

Here is a local image stored with the post:

![1.00](assets/cover.png "image caption")

## Code Blocks

```ts
type PostMeta = {
  title: string;
  date: string;
  tags: string[];
};

export function formatPost(meta: PostMeta) {
  return `${meta.title} (${meta.date})`;
}
```

```bash
pnpm install
pnpm --filter blog generate-index
pnpm --filter blog dev
```

```json
{
  "name": "markdown-syntax-showcase",
  "draft": false,
  "features": ["table", "image", "math", "code"]
}
```

## Table

| Feature | Syntax         | Supported |
| ------- | -------------- | --------- |
| Bold    | `**text**`     | Yes       |
| Image   | `![alt](path)` | Yes       |
| Table   | `\| col \|`    | Yes       |
| Math    | `$E=mc^2$`     | Yes       |

## Horizontal Rule

***

## Inline Math

Euler's identity: $e^{i\pi} + 1 = 0$

The quadratic formula: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$

## Block Math

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

$$
\mathrm{argmin}_{\theta} \sum_{i=1}^{n} \left(y_i - f_{\theta}(x_i)\right)^2
$$

## Mixed Content

Here is a short example combining multiple elements:

1. Define the model:

   $$
   y = mx + b
   $$

2. Render the result as code:

```python
def predict(m, x, b):
    return m * x + b
```

1. Document it in a table:

| Variable | Meaning   |
| -------- | --------- |
| `m`      | slope     |
| `x`      | input     |
| `b`      | intercept |

## Final Note

If this post renders correctly, Blogit is handling the core Markdown syntax you expect from a modern blogging system.

