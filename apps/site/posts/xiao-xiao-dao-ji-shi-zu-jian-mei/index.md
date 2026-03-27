---
title: '小小倒计时，没那么简单'
date: '2025-12-26'
tags:
  - 'Frontend'
---

倒计时是一个非常常见的 UI：

* 活动上线倒计时

* 发布会倒计时

* 秒杀系统倒计时

看起来只是简单地显示：

```html
00:10 → 00:09 → 00:08
```

但当你真正实现一个体验不错的倒计时页面时，其实有不少细节需要考虑。

## 1. 数字要等宽显示（tabular-nums)

这是一个我最近才注意到的小细节。很多字体里，数字宽度其实是不同的。

如果你给数字加了动画，倒计时变化时，容器的宽度会变化，导致 **抖动感**。

CSS 其实提供了一个专门的属性：

```css
font-variant-numeric: tabular-nums;
```

作用是：

> 让所有数字使用等宽排列。

也就是：

```html
0 1 2 3 4 5 6 7 8 9
```

每个数字占用的宽度一致。

如果你使用 Tailwind，使用

```html
<span class="tabular-nums">
```

> 这个属性需要字体的支持，并不是所有字体都支持这个属性

## 2. 时区问题

倒计时最容易出问题的其实是 **时区**。

比如活动时间是：

```html
2026-05-01 12:00
```

这其实是一个 **不完整的时间信息**，因为缺少时区。

如果你直接写：

```html
new Date("2026-05-01 12:00")
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

例如 `2026-05-01T12:00:00+08:00` 代表 `北京时间2026年5月1日中午12点整`。

前端只需要：

```typescript
const targetTimeStamp = new Date("2026-05-01T12:00:00+08:00").getTime()；
```

即可获取到正确的时间戳，这样所有用户看到的倒计时都是一致的。

## 3. 如何准确更新倒计时？

### 常见写法

```tsx
import React, { useEffect, useState } from "react"

const targetTimestamp = new Date("2026-05-01T12:00:00+08:00").getTime()

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

这种写法有适合页面**只有一个或少量倒计时的简单页面**，但是有三个问题：

* 只适合秒级倒计时，如果是更小单位，或者需要丝滑的动画过渡效果，仍然需要使用 `requestAnimationFrame` 实现。

- `setInterval` 本质上是 **宏任务（macrotask）**，如果JS 单线程阻塞，或浏览器标签页后台或省电模式触发节流 （暂停），它 **无法保证严格每 1000ms 执行一次。**

  > `setInterval` 和 `requestAnimationFrame` 在后台或者省电模式下都无法避免被节流或者暂停，导致切换过来的时候倒计时突然会跳一下，要想完全解决，最终方案是使用 `webworker` 开启新线程，但是这种还是太复杂，而且性能消耗也比较大。

- `Date.now()` **依赖本地系统时间**，如果系统时间有误差，倒计时也就不准确了。

  > 要解决这个问题，需要从服务端获取当前时间，这种一般是电商平台大型活动秒杀前端才会有，参考：[秒杀系统中的前端倒计时设计](https://hexi.men/blog/miao-sha-xi-tong-zhong-de-qian-duan)

### 毫秒倒计时版本

```tsx
import React, { useEffect, useState, useRef } from "react"

const targetTimestamp = new Date("2026-05-01T12:00:00+08:00").getTime()

export default function Countdown() {
  const [remain, setRemain] = useState(targetTimestamp - Date.now())
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const tick = () => {
      const _remain = targetTimestamp - Date.now()
      setRemain(_remain > 0 ? _remain : 0)
      if (_remain > 0) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const milliseconds = remain % 1000
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
      <span>{seconds.toString().padStart(2, "0")}s </span>
      <span>{milliseconds.toString().padStart(3, "0")}ms</span>
    </div>
  )
}
```

### webworker 版本

```typescript
// countdown.worker.ts
let targetTimestamp: number
let timer: number | undefined

self.onmessage = (e: MessageEvent) => {
  if (e.data.type === "start") {
    targetTimestamp = e.data.targetTimestamp
    startInterval()
  }
}

function startInterval() {
  if (timer) clearInterval(timer) // 防止重复启动
  timer = setInterval(() => {
    const remain = targetTimestamp - Date.now()
    if (remain > 0) {
      postMessage(remain)
    } else {
      postMessage(0)
      clearInterval(timer)
    }
  }, 16) // 每16ms ≈ 60fps，可根据需求调整
}
```

```tsx
import React, { useEffect, useState } from "react"
import CountdownWorker from "./countdown.worker.ts?worker"

const targetTimestamp = new Date("2026-05-01T12:00:00+08:00").getTime()

export default function Countdown() {
  const [remain, setRemain] = useState(targetTimestamp - Date.now())

  useEffect(() => {
    const worker = new CountdownWorker()
    worker.postMessage({ type: "start", targetTimestamp })

    worker.onmessage = (e: MessageEvent) => {
      setRemain(e.data)
    }

    return () => {
      worker.terminate()
    }
  }, [])

  const milliseconds = remain % 1000
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
      <span>{seconds.toString().padStart(2, "0")}s </span>
      <span>{milliseconds.toString().padStart(3, "0")}ms</span>
    </div>
  )
}
```


