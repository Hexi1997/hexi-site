---
title: '写给前端开发的设计系统（ Token）简介'
date: '2024-11-13'
tags:
  - 'Frontend'
  - 'Design'
---

做组件库或者网页设计时，你一定见过这些词：

**primary / accent / surface / border / text / state**

看起来很抽象，其实一点都不复杂。

这篇文章只做一件事：\
**用“做页面”的视角，把这些 token 讲清楚**

***

# 先记住这一句话

```
primary  → 主要按钮用啥颜色
accent   → 哪里需要点一下更好看
surface  → 背景一层一层怎么铺
border   → 哪些地方需要分隔一下
text     → 字有轻重层级
state    → 鼠标操作时怎么变
```

***

# 用一个页面来理解（最重要）

假设你在做一个常见页面：

👉 dashboard / 博客 / landing page

你其实是在做下面这些事情 

***

# 1. Surface：先把页面“铺出来”

你第一步一定是：

* 页面背景
* 卡片
* 弹窗

```
surface.base   // 页面背景
surface.card   // 卡片
surface.modal  // 弹窗
```

本质：**铺背景层**

如果没有 surface 分层：

页面会“糊成一片”\
dark mode 会很难做

***

# 2. Border：让结构清晰

接下来你会发现：

“东西有点挤，看不清边界”

于是你加：

* 卡片边框
* 分割线
* input 边框

```
border.subtle   // 分割线
border.default  // 卡片 / input
```

本质：**把内容分开**

***

# 3. Primary：告诉用户“点这个！”

页面里最重要的是按钮：

Sign up / Buy / Submit

你会用一个最显眼的颜色：

```
color.primary
```

本质：**引导用户点击**

***

# 4. Accent：让页面不无聊

如果页面太单调，你会加：

* tag
* badge
* 小图标

```
color.accent
```

本质：**点缀，而不是主角**

***

# 5. Text：信息分层

页面里一定有：

* 标题
* 描述
* 辅助信息

text.primary // 标题 / 正文主文本

> color.primary 是“让用户去点”的强调色，常用于按钮、链接、选中态
>
> text.primary 是“让用户去读”的文字颜色，常用于标题和正文
>
> 他们经常不相同

text.secondary // 描述\
text.tertiary // 辅助

本质：**信息有轻重**

***

# 6. State：交互反馈

最后你会处理交互：

* hover
* active
* focus

```
primary.hover
border.focus

```

本质：**用户操作要有反馈**

***

# 用一段话总结整个过程

```
1. 用 surface 搭骨架（背景、卡片）
2. 用 border 分块（避免糊）
3. 用 text 放信息（分层级）
4. 用 primary 引导点击（CTA）
5. 用 accent 做点缀（更生动）
6. 用 state 做反馈（更自然）

```

***

# 常见错误（非常真实）

* primary 到处用 → 没重点
* 没有 surface 层级 → 页面很平
* border 太重 → 看起来很“旧”
* text 没分级 → 信息混乱
* 没有 hover / focus → 体验很差

***

# 在组件库里的用法（重点）

这些 token 最终是给你写组件用的：

```
<Button variant="primary" />
<Card />
<Badge variant="accent" />
<Input />

```

背后映射：

```
Button.primary → color.primary
Card           → surface.card + border.subtle
Input          → surface.base + border.default

```

你不再“选颜色”，而是“用规则”

