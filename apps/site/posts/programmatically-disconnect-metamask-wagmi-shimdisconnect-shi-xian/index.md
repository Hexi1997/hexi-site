---
title: 'Programmatically disconnect MetaMask / Wagmi shimDisconnect 实现'
date: '2024-08-03'
tags:
  - 'Web3'
  - 'Frontend'
---

最近花了些时间研究了下 MetaMask 连接无法切换账户的问题。之前一直因为官方文档没有提供对应的api，以为不支持，后来观察到 Wagmi 通过 `shimDisconnect` 特性实验性支持了 programmatically disconnect。研究了一下它的源码，在此记录一下吧！

## 问题描述

在 Dapp 接入 MetaMask 钱包的时候，Dapp 退出登录的时候，MetaMask 没有提供 disconnect api 导致无法断开钱包和当前网站的连接状态。下次用户再次登录的时候，就无法弹出选择账户的界面。
详见 issus: <https://github.com/MetaMask/metamask-extension/issues/8990>

## 解决方案

参考 issue 下的回复和 wagmi 的 shimdisconnect 特性的实现 [https://github.com/wevm/wagmi/pull/616/files
](https://github.com/wevm/wagmi/pull/616/files)
核心代码如下，登录时通过调用 `wallet_requestPermissions` 唤起账户选择界面，然后再调用 `eth_requestAccounts` 获取用户选择的账户。

```typescript
const accounts = await window.ethereum.request({
    method: "wallet_requestPermissions",
    params: [{
        eth_accounts: {}
    }]
}).then(() => ethereum.request({
    method: 'eth_requestAccounts'
}))

const account = accounts[0]
```

## 思考

虽然 MetaMask 和 OKX 钱包可以通过这种方式实现需求，但是这或许是一种无奈之举。Web3 钱包目前绝大部分都不支持 programmatically disconnect。不知道是出于什么考量？如果是安全问题，Dapp控制自身与钱包的连接状态，应该是合理的，不存在任何安全问题。


