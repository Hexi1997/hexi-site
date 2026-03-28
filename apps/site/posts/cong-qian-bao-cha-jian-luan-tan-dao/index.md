---
title: '从钱包乱弹现象到 EIP-6963 标准'
date: '2024-06-02'
tags: ['Web3']
---

## 背景：钱包乱弹现象

在 Web3 Dapp 的实际使用过程中，你可能遇到过这样一个问题：

> 明明点击的是 **MetaMask 登录**，弹出的却是 **OKX Wallet** 或其他钱包。

这并不是偶发 bug，而是一个长期存在的生态问题。

### 根本原因

大多数 DApp 仍基于 EIP-1193 标准，通过全局对象 `window.ethereum` 与链交互。

但问题在于：

* 浏览器中可能同时安装多个钱包插件（MetaMask、OKX Wallet、Coinbase Wallet 等）
* 每个钱包都会向页面注入 `window.ethereum`
* **后加载的钱包会覆盖前一个钱包**

👉 最终结果就是：

> `window.ethereum` 被“劫持”，DApp 无法确定当前实际连接的是哪个钱包

---

## 问题带来的影响

这种机制会导致一系列用户体验问题：

* ❌ 用户点击 A 钱包，却唤起了 B 钱包
* ❌ DApp 无法精准识别钱包来源
* ❌ 不同钱包之间产生“隐性竞争”
* ❌ 用户体验混乱，甚至误以为是网站 bug

一些钱包（例如 OKX Wallet）会提供钱包选择入口，但更多钱包是**直接接管**。

---

## 解决方案：EIP-6963

为了解决这个问题，社区在 2023 年提出了 EIP-6963 标准。

### 核心思想

> 不再使用单一的 `window.ethereum`，而是允许多个钱包 **并存且可枚举**

EIP-6963 的关键改进：

* 每个钱包提供独立的 Provider 实例
* 通过事件机制广播钱包信息
* DApp 可以**主动发现所有可用钱包**
* 用户可以明确选择目标钱包

👉 本质上，它把“抢入口”变成了“公开列表 + 用户选择”

---

## 如何接入 EIP-6963？

目前已经有成熟工具链支持这一标准。

### 方案一：使用 WAGMI（推荐）

使用 Wagmi 2.x 版本：

* 原生支持 EIP-6963
* 自动处理多钱包 Provider
* 与 React 生态高度契合

---

### 方案二：使用 mipd + ethers

如果你希望更底层控制，可以：

* 使用 mipd 获取 Provider 列表
* 搭配 ethers.js 进行链上交互

简单流程：

1. 监听 EIP-6963 provider 注册事件
2. 收集所有钱包 provider
3. 渲染钱包列表 UI
4. 用户选择后再连接

---

## 示例思路（简化）

```ts
import { createStore } from 'mipd'

const store = createStore()

store.subscribe((providers) => {
  console.log('Available wallets:', providers)
})
```

---

## 为什么你应该尽快升级？

如果你的 DApp 仍然依赖 `window.ethereum`：

👉 你实际上是在依赖一个 **不稳定且不可控的全局状态**

升级到 EIP-6963 的好处：

* ✅ 消除钱包冲突
* ✅ 提升用户体验
* ✅ 更符合未来标准
* ✅ 避免被钱包“劫持”

---

## 总结

| 方案          | 特点                    |
| ----------- | --------------------- |
| EIP-1193（旧） | 单一 Provider，存在覆盖问题    |
| EIP-6963（新） | 多 Provider 共存，可枚举、可选择 |

👉 EIP-6963 本质是让钱包生态从“竞争入口”走向“标准化协作”。

---

## 参考资料

* https://metamask.io/news/developers/how-to-implement-eip-6963-support-in-your-web-3-dapp/
* https://github.com/MetaMask/vite-react-ts-eip-6963
