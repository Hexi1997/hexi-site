---
title: 'Next.js 中如何优雅地返回列表页，并保留之前的分页状态'
date: '2026-03-27'
tags:
  - 'Next.js'
  - 'Frontend'
  - 'Routing'
---

做博客列表页时，有一个很常见、但很容易被忽略的体验细节：

用户从 `/blog?page=3&tag=Frontend` 点进某篇文章后，再点击“返回”，应该尽量回到刚才那一页，而不是一律回到 `/blog`。

这个需求看起来不复杂，但如果处理得不仔细，最后体验通常会变成下面这样：

- 列表页本身支持分页和筛选
- 进入详情页后 URL 很干净
- 但返回时丢失了 `page` 和 `tag`
- 用户被送回第一页，只能重新翻到刚才的位置

最近我正好在自己的站点里处理了这个问题，顺手把思路整理一下。

## 一、先把列表状态放进 URL

第一步其实很关键：

如果列表页当前页码、筛选标签这些状态不在 URL 里，那“返回到之前的位置”基本就无从谈起。

比如博客列表页最好长这样：

```text
/blog?page=3&tag=Frontend
```

这样至少有两个好处：

1.  刷新页面后状态不会丢
2.  你可以明确知道“用户当前看到的是哪一页、哪一个筛选条件”

我这边是用 [`nuqs`](https://nuqs.dev/) 管理查询参数的，代码大概像这样：

```tsx
"use client";

import { parseAsInteger, parseAsString, useQueryState } from "nuqs";

const [selectedTag, setSelectedTag] = useQueryState(
  "tag",
  parseAsString.withDefault("All").withOptions({
    history: "replace",
    scroll: false,
  })
);

const [page, setPage] = useQueryState(
  "page",
  parseAsInteger.withDefault(1).withOptions({
    history: "replace",
    scroll: false,
  })
);
```

这里的重点不是一定要用 `nuqs`，而是：

- 页码、筛选条件这类列表状态应该是“可序列化”的
- 它们最好能直接映射到 URL 查询参数

这样列表页本身就先站稳了。

## 二、为什么不能只靠 `document.referrer`

一开始我也试过一个很直觉的方案：

在详情页点击“返回”时，读取 `document.referrer`，如果来源页是 `/blog`，就执行 `router.back()` 或者直接跳回 referrer。

看起来很合理，但在 Next.js 站内跳转里，这种方式并不稳定。

原因是：

- `document.referrer` 反映的是“当前文档最初是从哪里进入的”
- 它不是给 SPA 路由状态设计的
- 使用 Next.js 的客户端路由跳转时，站内页面切换不会像传统整页跳转那样稳定更新 `document.referrer`

实际结果就是：

- 你明明是从 `/blog?page=3&tag=Frontend` 点进详情页的
- 但到了详情页里，`document.referrer` 可能还是更早之前的页面
- 甚至根本拿不到你想要的列表 URL

所以，如果你的需求是“准确回到刚刚那个列表状态”，`document.referrer` 不能当作核心方案，只能当参考信息，甚至很多时候连参考都不够可靠。

## 三、详情页 URL 要不要带上 `page` 和 `tag`

这里我踩过一个很典型的坑。

一种看上去简单的做法是：从列表页跳详情时，直接把列表查询参数也带过去。

比如：

```text
/blog/my-post?page=3&tag=Frontend
```

这样详情页当然能知道“你是从第几页来的”，返回时也很容易拼出列表地址。

但问题也很明显：

- 详情页 URL 变脏了
- `page`、`tag` 明明是列表态，却出现在文章详情页里
- 分享文章链接时，这些参数也会被一起带出去

这类参数本质上不属于详情页本身，因此更合适的做法是：

- 列表页自己的状态继续保留在 `/blog?...`
- 详情页保持干净的 `/blog/[slug]`
- 额外用一份客户端状态，记录“我是从哪个列表 URL 进来的”

## 四、一个更稳妥的实现：进入详情前记住列表 URL

我的最终方案是：

1.  在博客列表点击文章时，把当前列表地址保存到 `sessionStorage`
2.  详情页顶部的“Back”优先读取这个地址
3.  如果能读到合法的 `/blog` 地址，就跳回去
4.  如果读不到，就兜底回 `/blog`

之所以选 `sessionStorage`，是因为它很适合这种“当前会话内的短期导航状态”：

- 不会污染详情页 URL
- 刷新当前标签页后仍然可用
- 关闭标签页后自动失效

先定义一个简单的 key 和判断函数：

```ts
export const BLOG_LIST_RETURN_HREF_STORAGE_KEY = "blog-list-return-href";

export function isBlogListHref(href: string) {
  return href === "/blog" || href.startsWith("/blog?");
}
```

然后在列表页点文章时，把当前地址记下来：

```tsx
const rememberListHref = () => {
  sessionStorage.setItem(
    BLOG_LIST_RETURN_HREF_STORAGE_KEY,
    `${window.location.pathname}${window.location.search}`
  );
};
```

挂到文章链接上：

```tsx
<Link href={`/blog/${post.slug}`} onClick={rememberListHref}>
  {post.title}
</Link>
```

最后在详情页的返回按钮里优先使用这份记录：

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function BlogBackLink() {
  const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const savedHref = sessionStorage.getItem(
      BLOG_LIST_RETURN_HREF_STORAGE_KEY
    );

    if (savedHref && isBlogListHref(savedHref)) {
      router.push(savedHref);
      return;
    }

    router.push("/blog");
  };

  return (
    <Link href="/blog" onClick={handleClick}>
      Back
    </Link>
  );
}
```

这样，用户如果是从：

```text
/blog?page=3&tag=Frontend
```

进入文章详情页，点击返回后就会准确回到：

```text
/blog?page=3&tag=Frontend
```

而不是掉回第一页。

## 五、为什么“兜底回第一页”也很重要

很多时候我们容易只关注“理想路径”，但一个健壮的返回逻辑一定要考虑兜底。

比如这些情况：

- 用户是直接打开详情页的，不是从列表点进来的
- 用户从外部链接进入文章详情页
- `sessionStorage` 里没有保存值
- 保存的值已经不是合法的博客列表地址

这时候最合理的行为不是报错，也不是卡住，而是：

```text
回到 /blog
```

也就是列表第一页，或者说默认列表视图。

这种兜底策略虽然简单，但它能保证“返回”这个动作始终有意义。

## 六、一个容易忽略的细节：页码越界

还有一个很实用的小优化：

如果筛选条件变化后，当前页码已经超出总页数，最好自动把页码修正回合法值。

比如：

- 原来你在第 4 页
- 选择了一个新标签后，结果只有 1 页
- 这时候继续保留 `page=4` 就不合理了

可以在列表页做一次矫正：

```tsx
const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
const currentPage = Math.min(Math.max(page, 1), totalPages);

useEffect(() => {
  if (page !== currentPage) {
    void setPage(currentPage);
  }
}, [currentPage, page, setPage]);
```

这样 URL、分页 UI、数据切片结果会始终保持一致。

## 七、总结

如果你想在 Next.js 里实现一个体验更自然的“返回列表页”功能，我会推荐下面这套思路：

1.  先把列表状态放进 URL，比如 `page`、`tag`
2.  不要把列表态参数污染到详情页 URL
3.  不要把 `document.referrer` 当成可靠方案
4.  在进入详情前，把当前列表 URL 存到 `sessionStorage`
5.  详情页返回时优先跳回这个地址
6.  如果没有可用状态，就兜底回 `/blog`

这套方案的优点是：

- 详情页 URL 干净
- 列表状态可恢复
- 对刷新和站内客户端跳转都更稳定
- 失败时也有明确兜底

很多时候，用户觉得“返回到之前那一页”是理所当然的，但实现上它其实是一个很典型的产品细节题。

一旦做好，这种细节虽然不显眼，但会明显提升站点的顺滑感。
