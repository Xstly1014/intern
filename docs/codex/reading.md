# 12 源码阅读实践

Codex 的 crate 数量很多，最有效的方法不是从目录树开始记忆，而是选择一条真实 turn，从入口一路追到模型、工具、沙箱和持久化。

## 推荐路线

```text
cli/main.rs
  -> tui 或 exec
  -> core/codex_thread.rs
  -> context_manager / agent
  -> protocol event
  -> tools / exec-server
  -> execpolicy / sandboxing
  -> thread-store / rollout
```

## 研究一个问题的步骤

1. 先写出用户可观察的行为和失败条件。
2. 找到 CLI 或 App Server 的入口参数。
3. 沿 request/response/event 类型追踪跨 crate 边界。
4. 找到策略判断和平台实现，而不是只看调用方。
5. 阅读对应测试，确认边界和设计意图。
6. 修改后同时验证交互、非交互和恢复路径。

## 常见扩展任务

| 任务 | 首要入口 | 必须补的验证 |
| --- | --- | --- |
| 新增 CLI 子命令 | `cli/src/main.rs` | help、参数冲突、退出码 |
| 新增工具 | `core/src/tools` | schema、审批、错误和截断 |
| 调整权限 | `execpolicy`、`sandboxing` | 允许/拒绝、三平台行为 |
| 新增协议事件 | `protocol`、`app-server-protocol` | TUI、SDK、兼容性 |
| 改上下文压缩 | `compact`、`context_manager` | 预算、恢复和摘要质量 |

## 排障思路

模型问题先看请求、provider 和重试；工具问题看策略、sandbox 和 exec-server；界面问题看事件映射、TUI 状态和 transcript；恢复问题看 thread ID、state 数据库和 rollout。不要只根据最终错误文本判断，优先寻找同一 turn 的结构化事件和日志。

## 最终心智模型

Codex 是一个事件驱动的本地 Agent：入口层负责接入，core 负责决策，工具层负责行动，沙箱负责限制，协议负责传播，状态层负责恢复。掌握这六个边界，就能在庞大的仓库中快速定位问题。

返回：[Codex 专题目录](/codex/)。

## 6. 追踪一个具体问题的示例

如果问题是“模型要求修改文件后没有执行测试”，可以这样定位：

1. 从 TUI transcript 或 SDK 事件确认是否产生了工具调用。
2. 在 `core` 检查工具是否被暴露、参数是否解析成功。
3. 在审批事件中确认用户是否拒绝或请求是否等待。
4. 在 exec-server 日志中确认进程是否启动、cwd 和退出码。
5. 检查工具结果是否回传模型，以及模型是否决定结束 turn。

这个路径比直接搜索“test”更有效，因为它沿着真实的事件和边界移动。

## 7. 修改源码时的证据链

每个改动都应能回答四个问题：输入从哪里来，状态在哪里改变，错误如何传播，用户如何观察结果。对应证据通常来自入口代码、协议类型、实现模块和测试。只改 UI 文本而不检查事件状态，往往会留下恢复或非交互路径的回归。

## 8. 建立自己的阅读笔记

建议为每个模块记录职责、输入输出、持久化对象、线程模型、权限边界、失败策略和测试位置。对 Codex 这种大型 workspace，按“能力地图”组织笔记比按目录复制文件名更容易形成整体理解。
