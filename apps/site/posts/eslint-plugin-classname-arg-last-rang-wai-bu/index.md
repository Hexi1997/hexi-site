---
title: 'eslint-plugin-classname-arg-last：让外部 className 永远拥有最高优先级'
date: '2025-04-22'
---

![img_5.webp](blob:http://localhost:8788/17473dd9-d26b-4219-9113-69b123515f9e)在 React 组件封装中，有一个非常常见的模式：

```typescript
cn("base-style", props.className)
```

`className` 是组件的对外扩展口。

它来自外部，通常代表使用者的“最终意图”。\
\
因此在大多数设计约定中：

> **外部传入的 className 应该拥有最高优先级。**

而在 Tailwind CSS 或 `twMerge` 的场景下，**参数越靠后，覆盖优先级越高**。\
\
这就意味着：

```typescript
cn("text-red-500", "text-blue-500") 
// 最终是 text-blue-500
```

所以正确的组件写法应该是：

```typescript
cn("internal-style", props.className)
```

而不是：

```typescript
cn(props.className, "internal-style")
```

否则组件内部样式可能反而把外部样式覆盖掉。

---

## 为什么需要 ESLint 规则？

在团队协作中，这种顺序很容易被忽略：

```typescript
cn(className, "base")
twMerge(className, "rounded-md")
```

代码不会报错，但语义已经错了。

当组件越来越多时，这种不一致会带来：

- 外部样式无法正确覆盖内部样式

- 调试样式时出现“为什么改不生效”的问题

- Code Review 反复纠正参数顺序

为了解决这个问题，我写了一个 ESLint 插件：

[eslint-plugin-classname-arg-last](https://github.com/Hexi1997/eslint-plugin-classname-arg-last)

---

## 它做的事情非常简单

它会检查：

- `cn(...)`

- `twMerge(...)`

如果发现 `className` 不在最后一个参数位置，就报错。

错误示例：

```typescript
cn("base", className, "active")
twMerge(className, "base")
```

正确示例：

```typescript
cn("base", "active", className)
twMerge("base", className)
```

其他函数不会被检查。

---

## 安装

```bash
npm install eslint-plugin-classname-arg-last --save-dev
```

---

## 配置

### ESLint v7 / v8

```javascript
{
  "plugins": ["classname-arg-last"],
  "rules": {
    "classname-arg-last/classname-arg-last": "error"
  }
}
```

### ESLint v9 Flat Config

```typescript
import classnameArgLast from "eslint-plugin-classname-arg-last";

export default [
  {
    plugins: {
      "classname-arg-last": classnameArgLast
    },
    rules: {
      "classname-arg-last/classname-arg-last": "error"
    }
  }
];
```

---

## 这条规则的真正价值

这不是一个“代码风格”规则。

它本质上是在强制一个组件设计原则：

> 组件内部提供默认样式\
> \
> 外部 className 负责覆盖与扩展\
> \
> 外部优先级永远最高

当这种约定被 lint 固化之后，你不再需要在 code review 里反复强调 “className 放最后”。

组件的扩展性也会更加稳定。

如果你在做组件库，或者项目里大量使用 `cn` / `twMerge`，这条规则值得加进团队规范。
