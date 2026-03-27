---

title: '为什么 VSCode 总是用错 TypeScript 版本？一篇讲清楚'
date: '2024-06-02'
tags: ["Frontend"]

---

## 问题背景

在日常开发中，你大概率遇到过这样一个场景：

> 明明依赖已经安装完成，但 VSCode 里依然出现一堆 TypeScript 报错。

而更诡异的是：

* 重启一下 VSCode 或 reload project 后又恢复正常
* 同样代码，在 CI 或构建时完全没问题

这类问题往往不是代码错误，而是 **TypeScript 版本不一致** 导致的。

---

## 根本原因

VSCode 默认使用的是**内置的 TypeScript 版本**，而不是你项目中的版本。

这就会导致：

* 本地项目使用的是 `node_modules/typescript`
* VSCode 使用的是自己的 TS（版本可能更高/更低）

👉 两者一旦不一致，就可能出现类型检查差异。

---

## 常见“假象”

这些现象本质上都和 TS 版本有关：

* ❌ 类型报错，但 `tsc` 编译正常
* ❌ 某些类型提示消失 / 不准确
* ❌ 新语法提示错误（例如 satisfies / const type parameters 等）
* ❌ 升级 TS 后 VSCode 没生效

---

## 解决方案

### 1. 手动切换 TypeScript 版本

在 VSCode 中：

* 打开任意 `.ts` 文件
* 点击右下角的 `TypeScript x.x.x`
* 选择：**Use Workspace Version**

这是最直接的方式，但问题是：

> ❌ 每次打开新项目都要手动操作

---

### 2. 配置 `typescript.tsdk`

你可以在 `.vscode/settings.json` 中配置：

```json
{
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

作用：

* 指定 VSCode 使用项目内的 TypeScript

但有一个坑：

> ⚠️ **首次打开项目时，这个配置可能不会立即生效**

---

### 3. 开启自动提示切换

```json
{
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

效果：

* 每次打开项目时，VSCode 会提示你切换到 Workspace TS
* 如果不切，它会反复提醒

👉 这是目前最接近“自动化”的方案

---

## 为什么问题仍然存在？

即使配置了以上内容，本质问题仍然没有被彻底解决：

### VSCode 的行为逻辑是：

* 默认优先使用内置 TS
* 将 Workspace TS 视为“可选项”
* 即使你“信任工作区”，也不会自动切换

👉 这带来一个体验上的矛盾：

> 已经信任工作区代码，却不信任工作区的 TypeScript 版本？

---

## 更理想的状态（但目前不存在）

一个更合理的行为应该是：

* 如果检测到 `node_modules/typescript`
* 自动切换到 Workspace TS
* 或至少提供一次性全局配置（默认始终使用 Workspace）

但截至目前，这仍然是一个未解决的问题：

* Microsoft 官方 issue：
  https://github.com/microsoft/vscode/issues/172732

---

## 实战建议（推荐组合）

在实际项目中，可以采用以下组合策略：

1. 项目内强制约定 TS 版本（写入 `package.json`）
2. 配置 `.vscode/settings.json`：

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

3. 团队约定首次打开项目必须切换

👉 虽然不完美，但能覆盖 90% 场景

---

## 总结

| 问题             | 本质           |
| -------------- | ------------ |
| VSCode 报错但构建正常 | TS 版本不一致     |
| reload 后恢复     | TS Server 刷新 |
| 配置无效           | 首次加载机制问题     |

👉 一句话总结：

> **你以为是代码问题，其实是 VSCode 用错了 TypeScript。**

---

## 参考资料

* https://stackoverflow.com/questions/74642723/how-do-i-force-visual-studio-code-to-always-use-my-workspaces-version-of-typesc
* https://github.com/microsoft/vscode/issues/172732
