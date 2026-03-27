---
title: '秒杀系统中的前端倒计时设计'
date: '2025-12-31'
tags:
  - 'Frontend'
---

秒杀活动倒计时，看起来很简单：几秒、几分钟倒计时而已。但实际上，如果设计不好，会出现**倒计时跳秒、提前结束、或者被用户改本地时间作弊**的情况。今天就聊聊前端秒杀倒计时的思路和最佳实践。

## 1. 倒计时的核心目标

* **准**：显示的时间尽量和服务器同步，不能因为本地时间不准就“提前开始”或者“晚结束”。

* **顺滑**：数字滚动、翻牌动画要流畅，不要跳秒。

* **安全**：倒计时只是给用户看的，不能决定是否能下单，真正权限还是服务器说了算。

## 2. 时间基准怎么搞

* **别完全靠本地时间**，像 `Date.now()` 这种，用户一改系统时间就不准了。

* **靠谱做法**：加载页面的时候拿一次服务器时间，然后算个偏差：

```html
remain = targetTimestamp - (Date.now() + (serverNow - Date.now()))
```

* 如果想更精准，还可以用 **SSE 或 WebSocket**，服务器实时推送时间，倒计时就完全跟服务器走。

<br />

## 3. SSE授时的典型实现

### 服务端 (Node.js 示例)

```javascript
import express from 'express';
const app = express();

app.get('/sse-time', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const interval = setInterval(() => {
    const serverTime = Date.now(); // ms
    res.write(`data: ${serverTime}\n\n`);
  }, 1000); // 每秒推送一次

  req.on('close', () => clearInterval(interval));
});

app.listen(3000);
```

### 前端 (React 示例)

```tsx
import React, { useEffect, useState } from "react";

export default function SeckillCountdown({ targetTimestamp }: { targetTimestamp: number }) {
  const [remain, setRemain] = useState(targetTimestamp - Date.now());

  useEffect(() => {
    const es = new EventSource("/sse-time");

    es.onmessage = (event) => {
      const serverTime = parseInt(event.data);
      const newRemain = targetTimestamp - serverTime;
      setRemain(newRemain > 0 ? newRemain : 0);
    };

    return () => es.close();
  }, [targetTimestamp]);

  const seconds = Math.floor(remain / 1000) % 60;
  const minutes = Math.floor(remain / 1000 / 60) % 60;
  const hours = Math.floor(remain / 1000 / 3600);

  return (
    <div>
      {hours} : {minutes} : {seconds}
    </div>
  );
}
```


