---
title: 'Claude Code CLI：如何快速开启「无许可模式」'
date: '2026-04-03'
tags:
  - 'AI'
---

在使用 Claude Code CLI 的过程中，有一个参数你大概率已经见过：`--dangerously-skip-permissions`

名字很长，而且每次都要手动输入一遍。

如果你和我一样，经常在本地项目里使用 Claude 做开发辅助，这个流程其实是有点麻烦的。

这篇文章就讲一件事：

👉 **如何优雅地、快速地开启“无许可模式”**

***

## 🤔 什么是“无许可模式”？

简单来说：

> 跳过 Claude Code CLI 的所有权限确认（文件读写 / shell 执行等）

默认情况下，Claude 在执行敏感操作时会询问你：

* 是否允许读写文件
* 是否允许执行命令
* 是否允许修改项目结构

而加上这个参数后：`claude --dangerously-skip-permissions`

👉 所有这些确认步骤都会被跳过

***

## ⚡ 为什么要开启？

在一些典型场景下，这个模式非常有用：

* 本地开发（你完全信任当前代码）
* 快速迭代 / 连续多轮操作
* 自动化流程（比如脚本驱动 Claude）

否则你会频繁遇到：

> “Allow this action?” → yes → 再来一次 → 再 yes...

非常影响效率。

***

## 🚀 最简单的方案：alias

直接在你的 shell 配置里加一行：`alias claude-skip="claude --dangerously-skip-permissions"`

然后你就可以：`claude-skip` 直接进入无许可模式。

👉 这种方式的缺点是不支持参数

***

## 🧱 工程化方案：wrapper 脚本

如果你想要支持参数，可以写一个脚本：`~/bin/claude-skip`

内容：

```shell
#!/usr/bin/env bash
claude --dangerously-skip-permissions "$@"
```

然后：`chmod +x ~/bin/claude-skip`

确保 `~/bin` 在 PATH 中。

以后直接用：`claude-skip`

***

## ⚠️ 一点理性提醒

这个参数之所以叫：

> `dangerously`

不是开玩笑的。

建议只在以下场景使用：

* ✅ 本地开发
* ✅ 自己完全理解的项目
* ❌ 不要用于陌生仓库
* ❌ 不要无脑让 AI 执行 shell

否则理论上它可以：

* 删除文件
* 修改代码
* 执行任意命令


