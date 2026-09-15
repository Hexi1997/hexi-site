---
title: 'Claude Code 后台服务总被「内存不足」停掉？其实是它自己在误杀'
date: '2026-09-15'
tags:
  - 'AI'
---

最近用 Claude Code 开发时，反复遇到同一个问题：让它用后台任务起的 dev 服务（server + 前端 dev server），跑着跑着就没了，任务通知里只有一句：

```text
Background command "Start full dev stack" was stopped because the system is running low on memory
```

我的机器是 **M5 + 32GB**，按理说跑几个 dev 服务绰绰有余。于是花了点时间排查，结论有点意外：

**杀掉进程的不是 macOS，而是 Claude Code 自己的「内存压力回收」机制，而且它明显误判了。**

## 先排除「系统真的内存不够」

第一反应当然是怀疑系统 OOM。但几个证据都对不上。

### 1. 系统日志里没有任何杀进程记录

macOS 真正因为内存不足杀进程时，内核会留下 `memorystatus` / `jetsam` 相关日志。查了被杀前后几分钟：

```bash
log show --start "2026-09-15 14:20:00" --end "2026-09-15 14:27:00" --style compact \
  --predicate '(process == "kernel" AND eventMessage CONTAINS[c] "memorystatus") OR eventMessage CONTAINS[c] "jetsam"'
```

结果是空的。系统在这段时间里一个进程都没杀。

### 2. 进程是被 SIGTERM 正常停止的

服务端日志最后一行：

```text
[process-debug] SIGTERM rss=375.4MB heapUsed=350.8MB
```

- 收到的是 `SIGTERM`，不是系统强杀时的 `SIGKILL`
- 服务自身才占 375MB，比启动时（744MB）还低，不存在内存泄漏

### 3. 系统整体可用内存还有一半多

```bash
memory_pressure | tail -1
# System-wide memory free percentage: 59%
```

59% 可用，怎么看都不像「内存不足」。

## 那内存到底去哪了？

虽然没到 OOM 的程度，但机器确实不算轻松：

| 项 | 数值 |
|---|---|
| Pages free（真正空闲） | 1.8 GB |
| 被压缩的内存 | **9.0 GB** |
| swap | **已用 2.0G / 共 3.0G** |

注意 `ps` 看到的 RSS 不包含被压缩的部分，要看真实占用得用 `top` 的 MEM 列：

```bash
top -l 1 -o mem -n 30 -stats pid,mem,cmprs,command
```

大头大概是这些：

- 另外两个 git worktree 各跑着一整套 dev 服务，每套约 2GB（Next.js dev server 单个就 0.8–1GB）
- VS Code 的 TypeScript / Vue 语言服务，一个进程 1.4GB
- Docker Desktop 虚拟机，加上压缩部分约 2.8GB
- 同时开着的 5 个 Claude Code 会话，每个 0.3–0.45GB
- Chrome、飞书、ChatGPT 等常驻应用

压缩内存高、swap 快用满，macOS 就会发出「内存偏紧」的**预警级**事件。这时离真正需要杀进程还远得很，但已经足够触发下面这个机制。

## 在 Claude Code 程序里找到原因

既然不是系统杀的，那就只可能是 Claude Code 自己停的。直接在它的可执行文件里搜那句提示：

```bash
python3 - <<'EOF'
import re
d = open('/Users/<you>/.local/share/claude/versions/2.1.272', 'rb').read()
for m in list(re.finditer(rb'running low on memory', d))[:3]:
    print(d[max(0, m.start()-1800):m.end()+300].decode('utf8', 'replace'))
EOF
```

找到两段关键代码（压缩过的，整理一下）：

```js
var z$e = { memory_pressure: "stopped because the system is running low on memory" };
```

```js
if (!Ce() && !a.CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP) {
  let I = () => {
    let D = r.get(e);
    if (D?.status !== "running" || D.notified || Date.now() - Rm() < v3s || /* ... */) return;
    y("task_local_shell_pressure_reap");
    oNt(e, n, "killed", /* ... */, "memory_pressure");
  };
  process.on("memoryPressure", I);
}
```

逻辑很清楚：

1. Claude Code 监听运行时抛出的 `memoryPressure` 事件（来自操作系统的内存压力通知）
2. 事件一来，对每个还在运行的后台 Bash 任务做判断，满足条件就直接标记为 `killed`，原因写 `memory_pressure`
3. 有一个环境变量可以整个关掉它：**`CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP`**

问题在于：

- **触发得太早**：预警级事件在内存还很充裕时就会发出，这时根本不需要杀任何东西
- **不分对象**：不管是跑一次就结束的脚本，还是需要常驻的 dev 服务，一视同仁
- **杀了也没用**：它只能停自己启动的后台命令，真正占内存的 VS Code、Docker、其他项目的服务一个都碰不到，腾出来的内存很有限
- **提示有误导性**：只说「系统内存不足」，既不说是 Claude Code 自己停的，也不提可以关掉的开关，看起来就像是 macOS 杀的

## 不止我一个人遇到

去 Claude Code 的 GitHub 仓库搜了一下，同类问题已经有好几个：

| Issue | 平台 | 情况 |
|---|---|---|
| [#83258](https://github.com/anthropics/claude-code/issues/83258) | macOS、Apple Silicon、32GB | 后台跑的约 18 分钟测试，会话空闲 51 秒就被停，当时可用约 15.8GB。被标为 stale 后关闭，没有维护者回复 |
| [#78674](https://github.com/anthropics/claude-code/issues/78674) | Linux、62GB | 4 小时内触发 8 次，共停掉 14 个后台任务，每次都是全部一起停，可用内存 38–40GB。仍开着 |
| [#92228](https://github.com/anthropics/claude-code/issues/92228) | Linux、23GB | 可用 17.9GB 时后台任务照样被停。仍开着，被标为重复 |

几个 issue 的共同点：**明明有大量可回收内存，这个机制还是当成内存不足，把后台任务一次性全停。**

另外，[官方文档](https://code.claude.com/docs/en/interactive-mode)里对这个机制的描述是：会话空闲一段时间（30 分钟）后，遇到系统内存压力才会回收后台 shell，该功能从 [v2.1.193](https://github.com/anthropics/claude-code/releases/tag/v2.1.193) 开始提供。但 #83258 里空闲 51 秒就被停，说明这个前提并没有被严格遵守。

## 解决办法

### 1. 关掉这个自动回收（推荐）

在 `~/.claude/settings.json` 里加上环境变量：

```json
{
  "env": {
    "CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP": "1"
  }
}
```

注意：**只对新开的会话生效**，已经开着的会话需要重开。

关掉之后，内存真的吃紧时交给 macOS 自己决定杀谁。这其实比让 Claude Code 盲杀更合理，系统比它更清楚谁是真正的内存大户。

### 2. 常驻服务不交给 Claude Code 后台跑

在自己的终端里手动起 dev 服务。这个回收机制只管 Claude Code 自己启动的后台命令，手动起的进程它不会碰。

### 3. 顺手减负

不管开没开上面的开关，这几点都值得做：

- 不用的 worktree 的 dev 服务及时停掉，一套大约 2GB
- 用完的 Claude Code 会话关掉
- Docker Desktop 的内存上限按需调小

## 总结

- 看到「stopped because the system is running low on memory」，**先别急着怀疑机器内存不够**，大概率是 Claude Code 的内存压力回收在误判
- 判断方法：查系统日志有没有 `memorystatus` / `jetsam` 杀进程记录，看进程收到的是 `SIGTERM` 还是 `SIGKILL`
- 解决方法：设置 `CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP=1`，重开会话
- 这个问题在 GitHub 上已经有多人反馈，截至写这篇文章时官方还没有修复
