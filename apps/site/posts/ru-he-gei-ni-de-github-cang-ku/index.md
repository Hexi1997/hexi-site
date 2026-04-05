---
title: '如何给你的 GitHub 仓库开启 Pull Request 自动 Code Review？'
date: '2026-02-10'
tags:
  - 'AI'
---

很多人写代码其实是没有 Code Review 的。

要么是一个人写，要么是团队太忙，PR 基本走个过场。

但其实你可以用一个免费的工具，把这件事自动补上。

***

## 一步开启 PR 自动 Review

用 [Gemini Code Assist](https://github.com/apps/gemini-code-assist) 就可以做到。

核心就两步：

1. 在 GitHub Marketplace 安装它
2. 选择你要启用的仓库

完成之后：

只要有人提 PR，就会自动帮你做 Code Review。

***

## 它会帮你做什么？

每次 PR，它都会自动：

* 生成变更总结（你不用自己写了）
* 逐行评论代码问题
* 给出修改建议（有些还能直接应用）

也可以手动触发：

```shell
/gemini review
```

***

## 免费额度够不够？

> **每天 33 次 PR review（免费）**

正常来说：

* 个人项目：完全够用
* 小团队：基本够用

***

## 谁的 PR 会被 Review？

重点一句话：

> **不是看是谁提的 PR，而是看仓库有没有开启**

也就是说：

* 别人给你仓库提 PR → 会触发
* 你团队成员提 PR → 会触发

***

## 支持 private 仓库吗？

支持

