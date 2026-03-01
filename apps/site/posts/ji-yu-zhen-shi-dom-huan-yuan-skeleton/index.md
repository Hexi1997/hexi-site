---
title: '基于真实 DOM 还原 Skeleton 的工程思考'
date: '2024-01-04'
---

![img_3.webp](assets/img_3.webp)在前端开发中，Skeleton（骨架屏）是提升用户感知性能的重要手段。常见做法是单独写一套灰色占位组件，但这种方法存在一些明显的问题：

- 骨架屏和真实 UI 结构脱节，修改 UI 需要额外同步 skeleton；

- 文字行高和布局难以精准还原，容易出现错位；

- 页面渲染过程中容易出现布局抖动（CLS）。

本文分享我在组件库中对骨架屏的思考，以及如何通过与组件耦合的方式实现精准还原。

---

## 传统 Skeleton 的问题

常见的实现方式是页面层写一套假的 Skeleton，例如：

```typescript
if (loading) {
  return <PageSkeleton />
}
```

这种方式存在几个问题：

1. **结构脱节**\
   \
   骨架屏和真实组件是两个平行的版本，修改组件必须同步改 skeleton。

2. **布局不精确**\
   \
   文字、行高、padding、响应式高度等都可能不一致，导致骨架屏和实际内容错位。

3. **维护成本高**\
   \
   组件库或页面升级时，需要额外维护 skeleton 组件。

---

## 我的方法：Skeleton 与组件结构耦合

我的核心思路是：

> 骨架屏应该是组件的一种状态，而不是独立组件。

实现方式：

- 在组件内部提供 `skeleton` 属性；

- Skeleton 结构与真实 DOM 一致，只替换内容节点；

- 复用组件布局，保持一致性。

使用示例：

```typescript
<Component skeleton={true} />
```

而不是：

```typescript
<ComponentSkeleton />
```

这种设计让骨架屏天然跟组件同步，修改组件布局时无需额外同步 skeleton。

---

## Skeleton 组件设计

我封装了一个基础 Skeleton 组件：

```typescript
import { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface ISkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * h-xx sm:h-xxx，支持媒体查询
   */
  containerHeightClassName?: string;
}

export function Skeleton(props: ISkeletonProps) {
  const { className, containerHeightClassName, ...rest } = props;

  if (containerHeightClassName) {
    return (
      <div className={cn('flex items-center', containerHeightClassName)}>
        <div
          className={cn(
            'animate-pulse rounded bg-[#fff] bg-opacity-10',
            className
          )}
          {...rest}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-pulse rounded bg-[#fff] bg-opacity-10',
        className
      )}
      {...rest}
    />
  );
}
```

---

## 核心创新点：`containerHeightClassName`

传统 Skeleton 难以精准还原文字高度，原因在于：

- 文字行高（line-height）影响实际占位高度；

- flex 布局和 padding 可能导致垂直对齐不一致；

- 响应式下文字大小变化，Skeleton 高度不变。

我的设计通过 `containerHeightClassName` 解决这些问题：

```typescript
<Skeleton
  className="h-4 w-32"
  containerHeightClassName="h-6 sm:h-8"
/>
```

最终渲染结果：

```typescript
<div class="flex items-center h-6 sm:h-8">
  <div class="animate-pulse rounded bg-[#fff] bg-opacity-10 h-4 w-32"></div>
</div>
```

优点：

1. **精准还原字体垂直居中**\
   \
   flex + items-center 保证了文字骨架块在容器内垂直居中，对齐真实内容。

2. **支持响应式**\
   \
   不同屏幕断点下，Skeleton 高度和真实文字高度保持一致。

3. **消灭布局抖动（CLS）**\
   \
   骨架占位高度与真实渲染高度一致，页面不会跳动。

---

## 为什么选择组件耦合

很多人认为 Skeleton 应该独立解耦，但我认为：

- Skeleton 本质是 UI 的一种状态；

- 状态属于组件内部；

- 因此骨架屏应该和组件结构绑定。

这种设计降低了维护成本，提高了骨架屏的准确性和用户体验。

---

## 总结

- Skeleton 不应该是单独的灰色占位块，而是未加载状态下的真实 DOM；

- `containerHeightClassName` 提供了对字体高度和行高的精准控制；

- 将 Skeleton 与组件结构耦合，既保持同步，又降低维护成本。

通过这种方式，我们可以构建结构语义化、响应式和精确还原的骨架屏，提升前端组件库的工程质量和用户体验。
