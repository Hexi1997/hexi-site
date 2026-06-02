---
title: 'agent-root-cli：把 Agent 全局指令收成一份'
date: '2026-06-02'
tags:
  - 'AI'
---

[`agent-root-cli`](https://github.com/Hexi1997/agent-root-cli) 是一个很小的 CLI，用来解决一个很具体的问题：

**如果同时在用 `Codex`、`Claude Code`、`Cursor`，全局指令应该维护在哪一份文件里？**

这类指令通常都比较稳定，比如：

- 默认用中文回答
- 改代码前先读上下文
- commit 前先确认
- 搜索优先用 `rg`

它们更像是长期工作流配置，而不是某次对话里的临时 prompt。

问题是，不同工具的接入方式并不一样：

- `Codex` 使用 `AGENTS.md`
- `Claude Code` 主要使用 `CLAUDE.md`
- `Cursor` 主要使用 `Rules / User Rules`

结果就是，同一套规则很容易被维护成几份，时间一长还会分叉。

## 这个项目做了什么？

`agent-root-cli` 的做法很直接：

**保留一份源文件，再把不同客户端接到这份源文件上。**

默认约定如下：

- 源文件：`~/AGENTS.md`
- Codex：`~/.codex/AGENTS.md -> ~/AGENTS.md`
- Claude：`~/.claude/CLAUDE.md -> ~/AGENTS.md`
- Cursor：手动创建一条 User Rule，指向 `@~/AGENTS.md`

这样一来，真正需要编辑的就只有 `~/AGENTS.md` 这一份。

## 怎么用？

先安装：

```bash
npm install -g agent-root-cli
```

初始化源文件：

```bash
agent-root-cli init
```

建立链接：

```bash
agent-root-cli link
```

如果只想先预览，不想直接写入文件，也可以用：

```bash
agent-root-cli link --dry-run
```

完成后，Codex 和 Claude 会共享同一份源文件内容；Cursor 只需要手动配一条 `@~/AGENTS.md` 的 User Rule，也能接入这套规则。

## 配合 skill 的用法会更方便

这个项目还有一个比较实用的搭配方式，就是配合 `update-user-memory` skill，把“修改全局指令”这件事也简化掉。

先安装这个 skill：

```bash
pnpx skills add Hexi1997/skills --skill=update-user-memory -g
```

前提是已经执行过：

```bash
agent-root-cli init
agent-root-cli link
```

之后就可以直接对支持 skills 的 agent 说：

> 记住到全局 AGENT 指令：默认回答简洁一点  
> 记住到全局 AGENT 指令：执行 commit 前必须先征得用户同意

这套流程会先检查链接是否配置正确，再定位真正的源文件，把新规则放到合适的 section，展示改动，确认之后再写入。

因为 `Codex` 和 `Claude` 使用的是软链接，所以源文件一旦更新，两个客户端就会立即同步；`Cursor` 只要已经配置了 `@~/AGENTS.md`，也能直接复用这份内容。

这样做的好处很简单：

- 全局指令只维护一份
- 不需要在多个客户端之间来回复制
- 后续新增规则时，可以直接用自然语言更新

## 最后

`agent-root-cli` 不是一个很重的工具，但它解决的是一个很常见、也很容易反复踩到的问题：

**只维护一份 Agent 全局指令，而不是维护三份。**

项目地址：

- GitHub: [Hexi1997/agent-root-cli](https://github.com/Hexi1997/agent-root-cli)
