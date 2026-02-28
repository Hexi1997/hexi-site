---
title: '从 shadcn/ui Button 到可定制 loading 的业务按钮'
date: '2026-02-28'
---

在前端开发中，按钮是最常用的组件之一。shadcn/ui 提供了默认的 Button 组件，但在实际业务中，它存在一些不足：

- 默认按钮没有 loading 状态

- 无法阻止重复点击

- loader 样式无法自定义，不适应不同主题

为了解决这些问题，我在 shadcn/ui Button 的基础上，封装了一个业务 Button 组件。

---

## 组件设计

核心目标：

1. **增加 loading 状态**

   - 当按钮正在处理请求时显示 loader

   - 自动禁用按钮，防止重复提交

2. **支持 loader 样式自定义**

   - 通过 `loadingClassName` 可以修改 loader 样式，例如深色模式下反色

3. **继承原生 Button 属性**

   - 保留所有原生属性，如 `type`, `onClick`, `disabled`

4. **安全点击逻辑**

   - 当按钮处于 loading 或 disabled 时，阻止点击事件

---

## 核心代码

```typescript
import React, { ReactNode, useMemo } from 'react';
import { cn } from '@/utils/cn';

export interface IButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: ReactNode;
  loading?: boolean;
  loadingClassName?: string;
}
export function Button(props: IButtonProps) {
  const {
    className,
    children,
    loading = false,
    disabled = false,
    onClick,
    style = {},
    loadingClassName,
    ...rest
  } = props;
  const buttonDisabled = useMemo(
    () => loading || disabled,
    [disabled, loading]
  );
  return (
    <button
      onClick={(e) => {
        if (onClick && !buttonDisabled) {
          onClick(e);
        }
      }}
      disabled={buttonDisabled}
      {...rest}
      className={cn(
        'flex items-center justify-center rounded-lg text-white duration-200',
        buttonDisabled && 'cursor-not-allowed',
        className
      )}
      style={disabled ? { opacity: 0.75, ...style } : style}
    >
      {children}
      {loading && (
        <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGZpbGw9IndoaXRlIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHN0eWxlPi5zcGlubmVyX2FqUFl7dHJhbnNmb3JtLW9yaWdpbjpjZW50ZXI7YW5pbWF0aW9uOnNwaW5uZXJfQXRhQiAuNzVzIGluZmluaXRlIGxpbmVhcn1Aa2V5ZnJhbWVzIHNwaW5uZXJfQXRhQnsxMDAle3RyYW5zZm9ybTpyb3RhdGUoMzYwZGVnKX19PC9zdHlsZT48cGF0aCBkPSJNMTIsMUExMSwxMSwwLDEsMCwyMywxMiwxMSwxMSwwLDAsMCwxMiwxWm0wLDE5YTgsOCwwLDEsMSw4LThBOCw4LDAsMCwxLDEyLDIwWiIgb3BhY2l0eT0iLjI1Ii8+PHBhdGggZD0iTTEwLjE0LDEuMTZhMTEsMTEsMCwwLDAtOSw4LjkyQTEuNTksMS41OSwwLDAsMCwyLjQ2LDEyLDEuNTIsMS41MiwwLDAsMCw0LjExLDEwLjdhOCw4LDAsMCwxLDYuNjYtNi42MUExLjQyLDEuNDIsMCwwLDAsMTIsMi42OWgwQTEuNTcsMS41NywwLDAsMCwxMC4xNCwxLjE2WiIgY2xhc3M9InNwaW5uZXJfYWpQWSIvPjwvc3ZnPg=="
          className={cn('ml-2 block', loadingClassName)}
        />
      )}
    </button>
  );
}
```

---

## 使用示例

```typescript
<Button
  loading={isSubmitting}
  loadingClassName="invert"
  className="bg-blue-600 hover:bg-blue-700"
  onClick={handleSubmit}
>
  提交
</Button>
```

- `loading` 为 true 时显示 loader

- 按钮禁用，防止重复点击

- loader 样式可通过 `loadingClassName` 自定义

---

## 总结

这个业务 Button 组件解决了 shadcn/ui 默认 Button 的不足：

1. 增加 loading 状态

2. loader 可自定义样式

3. 自动禁用点击，避免重复提交

它适合作为 React + Tailwind 项目中的业务标准按钮组件。
