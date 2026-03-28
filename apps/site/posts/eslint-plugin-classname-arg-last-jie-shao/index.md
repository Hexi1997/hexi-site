---
title: 'eslint-plugin-classname-arg-last 介绍'
date: '2025-04-21'
tags:
  - 'Frontend'
---

## 前置知识

在使用 Tailwind CSS 时，组合 className 是常见需求。我们经常使用一个名为 `cn` 的方法来高效且优雅地管理 class，它通常封装了以下两个常用工具：

### 1. clsx

* 更轻量、性能更优的 `classnames` 替代品
* 支持字符串、对象、数组等形式组合 class
* 示例：

```typescript
clsx('btn', { 'btn-primary': isPrimary }) // => 'btn btn-primary'
```

### 2. tailwind-merge

* 一个用于合并冲突的 Tailwind CSS 类名库。
* 处理如 `text-sm text-lg` 这类冲突，**保留最后一个优先级更高的类**。
* 示例：

```typescript
twMerge('text-sm text-lg') // => 'text-lg'
```

### 3. `cn` 方法封装

将以上两个库组合封装成一个统一的 `cn` 方法:

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
```

### 4. 为什么外部传入的 `className` 要放在最后一个参数位？

为了保证用户传入的样式能覆盖默认样式，推荐将 `className` 放在最后：

```typescript
cn('default-class', className)
```

因为 `twMerge` 是**从左到右合并**，后面的类将优先保留。如果顺序相反，组件默认样式可能会覆盖用户意图。

<br />

## 我做了什么？

为了保持 `className` 放在参数末尾的实践一致性，在 Grok3  的辅助下我开发了一个 ESLint 插件进行静态检测和自动修复，兼容 Eslint v7-v9。

Source:  <https://github.com/Hexi1997/eslint-plugin-classname-arg-last>

### 示例

```tsx
// 报错示例
cn(className, 'text-sm')

// 正确写法
cn('text-sm', className)
```

### 配置方式

在 `.eslintrc.js` 中添加：

```javascript
module.exports = {
  // ...
  plugins: ['classname-arg-last'],
  rules: {
    'classname-arg-last/classname-arg-last': 'error',
  },
}
```

通过这个插件，可以在开发阶段统一规范，减少因顺序问题导致的样式覆盖冲突。

