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

## 6. Thread 与 Rollout 的差别

Thread 是用户理解的会话，Rollout 是一次运行过程的证据。一个 thread 可以有多个 turn，也可能因为重试、fork 或压缩产生多个 rollout 片段。展示历史时需要合并可见消息，排障时则要保留工具参数、耗时和失败事件。

## 7. 恢复流程

```text
读取 thread id
  -> 校验工作目录和 Git 状态
  -> 载入配置与权限 profile
  -> 恢复消息与未完成事件
  -> 重建模型上下文
  -> 允许继续、fork 或归档
```

恢复不能自动恢复一个已经失效的审批。对于未完成的工具请求，应要求用户重新确认或明确标记为中断，避免重启后重复执行副作用命令。

## 8. 数据库和隐私

状态数据库需要迁移版本、事务和锁策略。会话中可能包含源码、密钥片段、内部 URL 和用户输入，导出、诊断和遥测都要脱敏。删除 thread 时还要考虑 rollout、附件和搜索索引是否被一并清理。

## 9. 可靠性检查

测试进程中断、磁盘只读、数据库损坏、并发 resume、重复 archive 和迁移失败。一个好的状态层在最坏情况下宁可显示“需要恢复”，也不要静默丢失用户的工作上下文。
