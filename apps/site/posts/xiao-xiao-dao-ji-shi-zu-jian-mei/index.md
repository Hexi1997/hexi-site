---
title: '小小倒计时组件，没那么简单'
date: '2025-12-26'
tags:
  - 'Frontend'
---

倒计时是一个非常常见的 UI：

* 活动上线倒计时
* NFT mint 倒计时
* 抢购倒计时
* 发布会倒计时

看起来只是简单地显示：

```
00:10 → 00:09 → 00:08
```

但当你真正实现一个体验不错的倒计时页面时，其实有不少细节需要考虑。

## 1. 时区问题

倒计时最容易出问题的其实是 **时区**。

比如活动时间是：

```
2026-04-01 20:00
```

这其实是一个 **不完整的时间信息**，因为缺少时区。

如果你直接写：

```
new Date("2026-04-01 20:00")
```

浏览器会默认按 **用户本地时区**解析。

如果你的用户分布在不同地区：

* 北京
* 东京
* 纽约

倒计时就可能全部不一样。

### 更安全的方式

 **使用带时区的时间（ISO 8601 格式）**

ISO 8601 时间格式是国际标准化组织制定的日期和时间表示法，标准格式为 `YYYY-MM-DDThh:mm:ssTZD`。它通过 `T` 分隔日期与时间，强制使用 24 小时制，支持 UTC 时间 `Z` 或时区偏移量，确保时间在各系统间传递时的精确性和无歧义性。

例如 `2025-12-26T12:00:00+08:00` 代表 `北京时间2025年12月26日中午12点整`。

<br />

前端只需要：

```typescript
const targetTimeStamp = new Date("2025-12-26T12:00:00+08:00").getTime()；
```

即可获取到正确的时间戳，这样所有用户看到的倒计时都是一致的。

## 2. 如何准确更新倒计时？

### 常见错误写法

```tsx
import React, { useEffect, useState } from "react"

const targetTimestamp = new Date("2025-12-26T12:00:00+08:00").getTime()

export default function Countdown() {
  const [remain, setRemain] = useState(targetTimestamp - Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setRemain(targetTimestamp - Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const seconds = Math.floor(remain / 1000) % 60
  const minutes = Math.floor(remain / 1000 / 60) % 60
  const hours = Math.floor(remain / 1000 / 60 / 60) % 24
  const days = Math.floor(remain / 1000 / 60 / 60 / 24)

  if (remain <= 0) return <div>Time's up!</div>

  return (
    <div>
      <span>{days.toString().padStart(2, "0")}d </span>
      <span>{hours.toString().padStart(2, "0")}h </span>
      <span>{minutes.toString().padStart(2, "0")}m </span>
      <span>{seconds.toString().padStart(2, "0")}s</span>
    </div>
  )
}
```

这种写法有两个问题：

第一个是 `setInterval` 本质上是 **宏任务（macrotask）**，如果JS 单线程阻塞，或浏览器标签页后台或省电模式 ，它 **无法保证严格每 1000ms 执行一次。**

第二个是 `Date.now()` **依赖本地系统时间**，如果系统时间有偏移，倒计时也就不准确了。


