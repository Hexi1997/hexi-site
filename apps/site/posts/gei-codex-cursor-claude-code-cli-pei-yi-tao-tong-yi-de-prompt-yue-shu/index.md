---
title: '给 Codex、Cursor、Claude Code CLI 配一套统一的 Prompt 约束'
date: '2026-06-02'
tags:
  - 'AI'
  - 'Design'
---

最近我在琢磨一件很具体、但又挺容易让人踩坑的事：

能不能给 `Codex`、`Cursor`、`Claude Code CLI` 这些编程代理客户端，设计一套统一的 prompt 约束注入机制？

更直白一点说，就是我们能不能只维护一份类似 `~/.agents/AGENTS.md` 的文件，然后让不同客户端在 session 初始化时都自动加载它？如果能，这件事会非常省心。团队可以有统一规范，个人也能有统一偏好，不用在每个客户端里重复维护一遍。

我先说结论：

**没有一个被这三家共同官方约定的“统一文件标准”。**  
但它们的机制已经足够接近，完全可以通过一层很薄的适配，把这件事做成。

这篇文章就梳理一下三家的官方机制、它们的差异，以及我最终更推荐的一套落地方案。

## 先说结论

截至 `2026-06-02`，如果问题是：

> 有没有一个像 `~/.agents/AGENTS.md` 这样的通用标准文件，可以被 Codex、Cursor、Claude Code CLI 一起原生自动加载？

我的答案是：

1. **没有跨客户端统一标准。**
2. **Codex 和 Cursor 都支持 `AGENTS.md`，但支持方式不完全一样。**
3. **Claude Code 的主机制不是 `AGENTS.md`，而是 `CLAUDE.md`。**
4. **如果想统一维护，最稳的办法不是赌一个文件名通吃，而是“单一真源 + 各端适配层”。**

也就是说，这不是“有没有标准”的问题，而是“怎么低成本兼容”的问题。

## Codex：`AGENTS.md` 是正式机制，而且支持分层作用域

如果你之前见过 `~/.codex/AGENTS.md`，那不是偶然文件，也不只是社区习惯，它背后是有官方机制支撑的。

OpenAI 在介绍 Codex 的文章里明确写过：**Codex 可以被仓库中的 `AGENTS.md` 文件引导**。这些文件可以告诉 Codex 如何理解代码库、该运行哪些测试命令、如何遵守项目惯例。[^openai-introducing-codex]

更进一步，OpenAI 在后续讲 Codex agent loop 的文章里，把这个机制讲得更细了：

- session 初始化时，Codex 会把用户指令聚合到上下文里
- 聚合源之一就是 `$CODEX_HOME` 下的 `AGENTS.override.md` 和 `AGENTS.md`
- 它还会从 Git 根目录到当前工作目录一路向下找 `AGENTS.md`
- 更深层目录里的 `AGENTS.md`，作用域更具体，优先级也更高[^openai-agent-loop]

这意味着什么？

这意味着 Codex 对 `AGENTS.md` 的支持其实是很完整的，它不是只认仓库根目录一份，而是有明显的“分层作用域”设计：

- 家目录级别：给所有项目的全局习惯
- 项目级别：给整个仓库的共享约束
- 子目录级别：给特定模块更细的规则
- 更深的规则覆盖更浅的规则

所以像 `~/.codex/AGENTS.md` 这样的入口，在 Codex 里是合理且有官方依据的。

## Claude Code：核心是 `CLAUDE.md`，但它给了跨文件复用能力

Claude Code 的机制很像，但文件名不同。

Anthropic 官方文档里，主入口是 `CLAUDE.md`，而且它支持多层位置：

- `~/.claude/CLAUDE.md`：用户级全局偏好
- `./CLAUDE.md`：项目共享指令
- `./.claude/CLAUDE.md`：也是项目级入口
- `./CLAUDE.local.md`：个人本地项目偏好[^claude-memory]

Claude Code 还支持从当前目录向上递归读取 `CLAUDE.md`，也会在需要时按需加载子目录中的 `CLAUDE.md`。这套机制和 Codex 的“层级生效”思路其实非常接近。

最关键的是，Anthropic 官方文档直接回答了一个很实际的问题：

> 如果仓库里已经有给其他 coding agent 用的 `AGENTS.md` 怎么办？

官方建议是：**新建一个 `CLAUDE.md`，然后在里面直接导入 `AGENTS.md`。**  
文档给出的例子就是：

```md
@AGENTS.md
```

如果还要追加 Claude 专属要求，也可以写成：

```md
@AGENTS.md

## Claude Code
对 `src/billing/` 下的更改使用 Plan Mode。
```

如果你连这一层也不想维护，官方还提到软链接也可以。[^claude-memory]

所以 Claude Code 的立场非常清晰：

- 它**不直接以 `AGENTS.md` 为主机制**
- 但它**明确支持你把 `AGENTS.md` 纳入自己的记忆体系**
- 它甚至是在官方文档里公开鼓励这么做

这对做跨客户端统一特别友好。

## Cursor：项目级支持 `AGENTS.md`，全局规则则主要走 Settings

Cursor 的情况稍微绕一点，因为它同时有多套规则机制：

- `.cursor/rules`
- `User Rules`
- `AGENTS.md`
- 以及旧的 `.cursorrules`[^cursor-rules]

官方文档对这几种机制的定位很明确：

### 1. `.cursor/rules` 是主力规则系统

这是 Cursor 当前最完整的规则系统。它支持作用域、分文件、自动附加、手动触发等能力，明显是给复杂项目用的。

### 2. `AGENTS.md` 是简单版

官方文档把 `AGENTS.md` 描述为：

- 用 Markdown 写 agent 指令
- 作为 `.cursor/rules` 的简单替代
- **放在项目根目录**
- 适用于简单、直观的用例[^cursor-rules]

而且文档当时还明确写了一个限制：

- `AGENTS.md` **仅支持项目根目录**
- 不支持像 `.cursor/rules` 那样做复杂作用域拆分
- 子目录嵌套支持是后续版本规划，而不是当前基线[^cursor-rules]

### 3. Cursor CLI 会读项目根的 `AGENTS.md` 和 `CLAUDE.md`

这点很重要。Cursor CLI 官方文档明确写到：

- CLI 支持和 IDE 一样的规则系统
- 它会读 `.cursor/rules`
- 还会额外读取**项目根目录**里的 `AGENTS.md` 和 `CLAUDE.md`，并把它们作为 rules 应用[^cursor-cli]

这意味着，至少在项目级别，Cursor CLI 对跨生态兼容是比较积极的。

### 4. 但我没看到官方支持“home 目录 markdown 规则文件”

这也是我这次专门反复确认过的一点。

Cursor 官方确实有“全局规则”，但文档写法是：

- `User Rules`
- 在 `Cursor Settings > Rules` 里定义
- 对所有项目生效[^cursor-rules]

我目前**没有查到公开官方文档**把它描述成某个固定的 home 目录 markdown 文件，比如：

- `~/.cursor/AGENTS.md`
- `~/.cursor/rules.md`
- `~/.config/cursor/rules.md`

所以对 Cursor 来说，比较稳的表述应该是：

- **有全局规则能力**
- **但公开文档没有把它定义成可依赖的用户级 markdown 入口**

这和 Codex、Claude Code 明显不一样。

## 为什么会出现这种“差一点统一”的局面？

因为三家的目标其实很像，但产品演化路径不一样。

### Codex 的思路更像“文件即约束”

它把 `AGENTS.md` 当作一种很自然的环境指令机制，可以出现在家目录、仓库、子目录里，并且有明确的层级作用域。

### Claude Code 的思路更像“记忆系统”

它把 `CLAUDE.md` 定位成 memory，强调的是跨会话、跨目录层级的持久上下文，同时允许通过 `@import` 把别的文件纳入体系。

### Cursor 的思路更像“规则系统 + 简化兼容层”

它真正主推的是 `.cursor/rules` 和 settings 里的 User Rules，而 `AGENTS.md` 更像一个兼容简单场景、兼容其他 agent 生态的桥接入口。

所以你会发现它们并不是在争一个同名标准，而是在不同产品哲学下，逐渐收敛出几种相似能力。

## 真想统一，推荐怎么做？

如果目标是：

- 一份个人偏好，尽量多客户端复用
- 一份项目规范，尽量多客户端复用
- 又不想和某一家客户端绑死

我更推荐下面这套结构。

## 方案一：项目级统一，最稳

这是我最推荐的基线方案。

```text
repo/
  AGENTS.md
  CLAUDE.md
  .cursor/
    rules/
```

职责这样分：

- `AGENTS.md`
  - 作为跨工具共享的主规范
  - 写团队都会关心的内容
  - 比如代码风格、测试命令、目录约定、提交流程

- `CLAUDE.md`
  - 只做 Claude 适配
  - 最简单可以只有一行：

```md
@AGENTS.md
```

- `.cursor/rules/`
  - 只放 Cursor 专属、需要作用域或 metadata 的规则
  - 比如某个目录的自动附加规则，某类文件的特殊操作要求

这套好处是：

- Codex 原生支持 `AGENTS.md`
- Claude Code 通过 `CLAUDE.md -> @AGENTS.md` 复用同一份内容
- Cursor 能直接读项目根 `AGENTS.md`
- 如果 Cursor 需要更复杂的 scoped rules，再单独补 `.cursor/rules`

这基本是“兼容性 / 简洁度 / 可维护性”三者之间最平衡的一种。

## 方案二：个人级统一，用“单一真源 + 适配层”

如果你还想把“全局偏好”也统一起来，我建议不要强依赖某个客户端是否支持 home 目录 markdown 文件，而是自己维护一个真源，然后分发到各家。

比如：

```text
~/.agents/AGENTS.md
~/.codex/AGENTS.md
~/.claude/CLAUDE.md
```

其中：

- `~/.agents/AGENTS.md`
  - 你自己的统一真源
  - 不指望任何客户端原生认它

- `~/.codex/AGENTS.md`
  - 可以直接软链接到 `~/.agents/AGENTS.md`

- `~/.claude/CLAUDE.md`
  - 写成导入：

```md
@~/.agents/AGENTS.md
```

- Cursor
  - 目前更现实的做法是同步到 `User Rules`
  - 而不是指望 `~/.cursor/AGENTS.md` 这类未文档化入口

如果你愿意再工程化一点，完全可以写个小脚本来同步：

- 把主文件同步到 Codex 家目录
- 生成 Claude 的导入文件
- 把内容写入 Cursor 的 User Rules 配置入口

这样虽然没有“一个文件被三家原生自动加载”那么理想，但维护成本已经很低了。

## 这套统一规范里，应该写什么，不该写什么？

这一点也挺关键。

我现在更倾向于把跨客户端共享内容控制在几类“高复用、低歧义”的信息上：

### 适合放进共享主文件的内容

- 代码风格约定
- 目录结构说明
- 测试 / lint / build 常用命令
- 提交前检查要求
- PR 描述偏好
- 命名规范
- 哪些文件不能动
- 哪些改动必须先提方案

这些东西通常和具体客户端无关，换个 agent 也应该成立。

### 更适合放进客户端适配层的内容

- 某客户端特有模式
- 某客户端特有命令
- 某客户端的权限、审批、计划模式偏好
- 某客户端特有的 rules metadata

比如这类内容：

- “Claude 改 billing 目录时使用 Plan Mode”
- “Cursor 对特定 glob 自动附加规则”
- “Codex 在某个目录遵守额外 AGENTS 层级约束”

这些更适合放到 `CLAUDE.md` 或 `.cursor/rules` 里，而不是塞进跨工具主文件。

## 我现在的建议

如果你只是想解决“多客户端重复维护 prompt 约束”的问题，我会建议你从下面这套最小方案开始：

### 项目内

```text
AGENTS.md
CLAUDE.md
.cursor/rules/
```

其中：

- `AGENTS.md` 写共享规则
- `CLAUDE.md` 先只写 `@AGENTS.md`
- `.cursor/rules/` 暂时只在确实需要 scoped rules 时再加

### 用户级

```text
~/.agents/AGENTS.md
~/.codex/AGENTS.md -> ~/.agents/AGENTS.md
~/.claude/CLAUDE.md
```

其中：

- `~/.agents/AGENTS.md` 是你的真源
- `~/.codex/AGENTS.md` 链过去
- `~/.claude/CLAUDE.md` 导入它
- Cursor 全局偏好通过 Settings 维护，必要时由脚本同步

这不是一个“官方统一标准”，但它已经非常接近“工程上足够统一”。

## 最后

所以回到最初那个问题：

> 有没有一个通用的 md 文件，比如 `~/.agents/AGENTS.md`，让各个客户端在 session 初始化时都去加载？

严格说，**没有这样的跨客户端官方标准。**

但如果把问题换成：

> 有没有一种足够通用、维护成本足够低、能在 Codex / Cursor / Claude Code 之间共享大部分约束的实践？

答案就是：**有，而且并不复杂。**

关键不是等三家先统一，而是你自己先把“共享主规范”和“客户端适配层”分开。  
一旦这层抽象建立起来，后面无论你再接入新的 coding agent，成本都会低很多。

## 参考资料

- OpenAI, *Introducing Codex*  
  https://openai.com/index/introducing-codex/

- OpenAI, *Unrolling the Codex agent loop*  
  https://openai.com/index/unrolling-the-codex-agent-loop/

- Anthropic, *管理 Claude 的内存 / Memory*  
  https://code.claude.com/docs/zh-CN/memory

- Anthropic, *Claude Code Settings*  
  https://docs.anthropic.com/en/docs/claude-code/settings

- Cursor, *Rules*  
  https://docs.cursor.com/en/context

- Cursor, *Using Agent in CLI*  
  https://docs.cursor.com/en/cli/using

[^openai-introducing-codex]: OpenAI 在 `2025-05-16` 发布的 *Introducing Codex* 中明确写到，Codex 可以被仓库中的 `AGENTS.md` 文件引导。

[^openai-agent-loop]: OpenAI 在 `2026-01-23` 发布的 *Unrolling the Codex agent loop* 中说明了 Codex 会聚合 `$CODEX_HOME` 与项目层级中的 `AGENTS.md` / `AGENTS.override.md`。

[^claude-memory]: Anthropic 的 Claude Code Memory 文档说明了 `CLAUDE.md` 的加载位置、导入能力，以及如何通过 `@AGENTS.md` 复用其他 agent 的项目指令。

[^cursor-rules]: Cursor Rules 文档说明了 `.cursor/rules`、`User Rules` 与 `AGENTS.md` 的角色区分，并将 `AGENTS.md` 描述为项目根目录下的简单替代方案。

[^cursor-cli]: Cursor CLI 文档说明 CLI 会读取项目根目录中的 `AGENTS.md` 和 `CLAUDE.md`，并与 `.cursor/rules` 一起应用。
