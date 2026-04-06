---
title: 'React 组件文件命名：在 Agent 时代 PascalCase 和 kebab-case 的抉择与困惑'
date: '2025-04-08'
tags:
  - 'AI'
---

最近在项目里拆页面组件时，意识到一个问题：在 **Agent 时代**，到底是 PascalCase 还是 kebab-case 更合适？

## 1. PascalCase 的优势

* 文件夹名和组件名一致，比如 `HeroSection`。
* Agent 生成或修改组件时可以直接匹配组件名：

```tsx
import { HeroSection } from "@/components/pages/home/HeroSection"
```

* Page 文件组合 Section 时非常直观，一眼就能知道哪个组件对应哪个功能。
* 搜索、定位组件更容易，减少自动化出错几率。

简而言之，**PascalCase 对 Agent 友好**，尤其是页面专用的 Section 组件。

## 2. kebab-case 的背景

* shadcn 官方推荐，用于 UI 复用组件库：

```tsx
import { DropdownMenu } from "@/components/ui/dropdown-menu"
```

* 好处：
  * 跨平台安全（避免大小写敏感问题）
  * 符合 npm / Vite / Webpack 生态规范
  * 层级多时路径清晰

* 限制：
  * 对 Agent 自动生成和搜索组件不如 PascalCase 直观

## 3. 当前的困惑

* PascalCase 在 Agent 场景下更好，但和 UI 库命名规范不一致
* kebab-case 符合复用库标准，但不够自动化友好
* **在同一个项目里，是混用、折中**？


