---
title: "eslint-plugin-classname-arg-last 介绍"
category: Product
date: "2025-04-21"
---

| title | ss | ss |
| --- | --- | --- |
| ss | ss | ww |
| dd | ee | ff |

## 前置知识

使用 Tailwind CSS 时，合并类名称是常见的需求。我们通常使用一种叫做`cn` 的方法来高效且优雅地管理类，通常包含以下两种常用工具：

### 1. clsx

- 比 `classname` 更轻便、更高性能的替代方案
- 支持以字符串、对象、数组等形式组合类

```
clsx('btn', { 'btn-primary': isPrimary }) // => 'btn btn-primary'
```

### 2. tailwind-merge（简称 twMerge）

- 合并冲突的 Tailwind CSS 类名称
- 处理冲突，比如 `text-sm text-lg`， **保留优先级更高的最后一个类**

```
twMerge('text-sm text-lg') // => 'text-lg'
```

### 3. cn 方法封装

将上述两个库合并为统一的`cn` 方法：

```
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
```

### 4. **为什么** `className` **应该是最后一个参数？**

为了确保用户提供的样式能够覆盖默认样式，建议将 `className` 放在最后

```
cn('default-class', className)
```

由于 `twMerge` 是**从左向右**合并的，后面出现的将优先。如果顺序相反，组件的默认样式可能会覆盖用户意图。

## 我做了什么？

为了保持参数末尾放置 `className` 的一致性，我开发了一个 ESLint 插件，用于静态检测和自动修复，借助 Grok3，兼容 Eslint v7-v9

[eslint-plugin-classname-arg-last](https://www.npmjs.com/package/eslint-plugin-classname-arg-last)

### 1. Example

```
// Error example
cn(className, 'text-sm')

// Correct usage
cn('text-sm', className)
```

### 2. 配置

```
module.exports = {
  // ...
  plugins: ['classname-arg-last'],
  rules: {
    'classname-arg-last/classname-arg-last': 'error',
  },
}
```
