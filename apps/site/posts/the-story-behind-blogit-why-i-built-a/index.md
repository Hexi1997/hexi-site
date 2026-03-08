---
title: 'The Story Behind Blogit: Why I Built a Git-Powered, Local-First Blogging System'
date: '2026-03-06'
pinned: true
tags:
  - 'Blogit'
---

**I used to believe publishing meant ownership.**

For years, I wrote on Web2 platforms like [Medium](https://medium.com). They were polished, easy to use, and had built-in distribution. You could focus on writing and let the platform handle everything else.\
But over time, I started to feel the tradeoff: I was creating content, but I didn’t really control its fate. My writing lived inside someone else’s product, someone else’s rules, someone else’s business model.

**Then I entered the Web3 world.**

I was deeply convinced by the idea of decentralization, so I moved my blog to [xLog](https://xlog.app). It felt like the right answer: creator ownership, censorship resistance, open protocols. I didn’t just switch tools, I switched beliefs. I thought I had finally solved the ownership problem.

Until 2025.

**[xLog](https://xlog.app), along with the** **[Crossbell](https://crossbell.io)** **chain behind it, stopped operating**. Painfully, I realized that every post I had published there was gone.\
That was the moment everything became brutally clear:

Publishing on a “decentralized” platform is still not the same as owning your content.

If your writing cannot be restored independently, migrated freely, and served without a single product dependency, then you don’t truly own it. You’re still renting infrastructure, just with a different narrative.

## What I Learned

I no longer define content ownership by where it is published.\
I define it by whether I can survive platform failure.

Real ownership means:

* My content exists as local files.
* Every change is versioned in Git.
* Images and assets are stored with the post, not in a third-party silo.
* I can deploy anywhere, migrate anytime.
* Platforms are distribution channels, not my source of truth.

That is exactly why I built **Blogit**.

## Introducing Blogit

**Blogit** is a Git-powered, local-first blogging system built around one principle:

**Own your content. For real.**

Its core model is simple:

* **Content as code**: Posts are Markdown in your own repo.
* **Writing as commit**: Every edit is a commit with full history.
* **Publishing as push**: CI/CD turns pushes into published pages.
* **Cloneable and forkable**: Your blog is portable and reproducible.
* **No platform lock-in**: You can move without rewriting your life’s work.

On top of that, Blogit gives you modern publishing capabilities:

* SSG-based SEO (metadata, sitemap, robots)
* Local media storage (`posts/<slug>/assets`)
* Visual admin panel with Markdown block-level editing (Milkdown)
* Optional Giscus comments
* Cloudflare deployment workflow

## Final Thought

I don’t think platforms are bad.\
I still use them. But now I use them differently.

I publish to platforms for reach.\
I publish to Blogit for permanence.

Because after losing content once, you stop optimizing only for convenience.\
You start optimizing for survival.

---

## 中文版

**我曾经以为，发布就等于拥有。**

很多年里，我一直在 [Medium](https://medium.com) 这样的 Web2 平台上写作。它们足够成熟、易用，而且自带分发能力。你只需要专注写作，剩下的事情交给平台。\
但时间久了，我逐渐感受到那种隐性的代价：内容虽然是我写的，但它的命运其实并不由我掌控。我的文字住在别人的产品里，受制于别人的规则、别人的商业模式。

**后来，我进入了 Web3 世界。**

我曾非常认同去中心化的理念，所以我把博客迁移到了 [xLog](https://xlog.app)。它看起来像是正确答案：创作者所有权、抗审查、开放协议。我不只是换了一个工具，而是换了一套信念。我一度以为，内容所有权的问题终于被解决了。

直到 2025 年。

**[xLog](https://xlog.app) 以及其背后的** **[Crossbell](https://crossbell.io)** **链停止运营**。我痛苦地意识到，我发布在那里的所有文章都丢失了。\
那一刻，很多事情一下子变得非常清楚：

把内容发布在一个“去中心化”平台上，依然不等于你真正拥有了它。

如果你的文章不能被独立恢复、自由迁移，并且在不依赖某一个具体产品的前提下继续提供访问，那你其实并没有真正拥有它。你仍然是在租用基础设施，只不过换了一套叙事。

## 我学到的事情

现在，我不再用“内容发布在哪儿”来定义所有权。\
我用“平台失效后我还能不能活下来”来定义它。

真正的所有权意味着：

* 我的内容以本地文件存在。
* 每一次修改都由 Git 做版本管理。
* 图片和静态资源跟文章一起存放，而不是丢在第三方孤岛里。
* 我可以部署到任何地方，也可以随时迁移。
* 平台只是分发渠道，而不是我的事实源头。

这也正是我构建 **Blogit** 的原因。

## 介绍 Blogit

**Blogit** 是一个 Git 驱动、以本地优先为核心的博客系统，它围绕一个原则构建：

**真正拥有你的内容。**

它的核心模型非常简单：

* **内容即代码**：文章是你自己仓库里的 Markdown 文件。
* **写作即提交**：每一次编辑都是一次可追溯的 commit。
* **发布即推送**：CI/CD 会把每一次 push 变成线上页面。
* **可克隆、可 fork**：你的博客可以被移植，也可以被复现。
* **没有平台锁定**：你可以迁移，而不用重写自己的人生作品。

除此之外，Blogit 也提供了现代博客发布所需的能力：

* 基于 SSG 的 SEO 能力（metadata、sitemap、robots）
* 本地媒体资源存储（`posts/<slug>/assets`）
* 带有 Markdown 区块级编辑体验的可视化后台（Milkdown）
* 可选的 Giscus 评论系统
* Cloudflare 部署工作流

## 最后的想法

我并不认为平台是坏的。\
我现在依然会使用它们，只是使用方式不同了。

我把内容发布到平台，是为了触达更多人。\
我把内容发布到 Blogit，是为了让它长久存在。

因为当你真正失去过一次内容之后，你就不会只为方便而优化。\
你会开始为“生存能力”而优化。
