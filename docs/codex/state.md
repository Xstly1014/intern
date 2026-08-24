# 07 会话、历史与状态

一次 Agent 任务通常跨越多个 turn、多个进程甚至多天。Codex 因此把对话、运行记录和应用状态拆开保存，既支持恢复，也避免把所有 UI 瞬时状态都当成模型上下文。

## 数据关系

```text
Thread
  ├─ Turn 1..N
  │   └─ Item：消息 / 工具调用 / 文件变化
  ├─ Rollout：运行过程记录
  └─ State：索引、配置、归档和恢复信息
```

`thread-store` 负责会话索引和持久化，`history`/`message-history` 管理可展示历史，`rollout` 记录执行轨迹，`state` 使用 SQLite 保存结构化应用状态。恢复时需要重建 thread、工作目录、模型配置和未完成请求，而不是只读取最后一条文本。

## 压缩与回放

历史压缩会生成摘要并保留关键约束；rollout replay 则用于诊断某次模型和工具执行。两者目标不同：压缩优化上下文预算，回放保留证据链。

## 状态可靠性

状态数据库要处理迁移、锁、损坏恢复和并发访问。写入顺序应先保证事实，再更新索引；清理历史需要考虑用户是否仍能通过 thread ID 找到会话。认证和敏感内容必须独立脱敏。

## 源码入口

- `codex-rs/thread-store`
- `codex-rs/history`、`message-history`
- `codex-rs/rollout`、`rollout-trace`
- `codex-rs/state`
- `codex-rs/core/src/thread_manager.rs`

下一章：[App Server 与多端接入](/codex/app-server)。
