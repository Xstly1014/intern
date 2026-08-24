# 03 codex-core Agent 运行时

`codex-core` 是 Codex 的决策与执行中枢。CLI、TUI、App Server 和 SDK 都通过它共享同一套 thread、turn、上下文、工具和事件语义。

## 运行链路

```text
Thread 创建
  -> 加载 Config / AGENTS.md / Skills
  -> 组装上下文与工具清单
  -> 启动 Turn
  -> 消费模型事件
  -> 执行工具并回传结果
  -> 继续决策或完成
  -> 保存 rollout / state
```

核心入口位于 `codex-rs/core/src/lib.rs`、`codex_thread.rs`、`context_manager.rs` 和 `agent/`。`Thread` 是可恢复的长期会话，`Turn` 是一次用户任务，`Item` 是 turn 中的消息、工具调用或文件变更事件。

## Agent 循环的关键职责

| 阶段 | 处理内容 | 失败时的策略 |
| --- | --- | --- |
| 上下文准备 | 项目规则、历史、工具、模型参数 | 缺少可选信息时降级 |
| 模型请求 | 流式文本、工具调用、重试 | 分类重试或结束 turn |
| 工具执行 | 审批、沙箱、超时、输出截断 | 将结构化错误回传模型 |
| 上下文维护 | 压缩、预算、摘要 | 保留目标和未完成约束 |
| 收尾 | 最终回复、状态、rollout | 保证可恢复和可诊断 |

## 上下文不是简单拼接

上下文管理器会区分系统指令、项目指令、用户输入、历史消息、工具定义和工具结果。`AGENTS.md` 具有目录层级继承关系，越靠近当前文件的规则通常越具体；Skills 则按任务需要加载，避免把所有知识常驻在 prompt 中。

当 token 接近预算时，`compact` 相关模块会压缩旧历史。高质量压缩必须保留已经修改的文件、测试结果、失败原因、用户偏好和下一步计划，否则后续模型会重复执行已完成的动作。

## 事件映射与扩展

`event_mapping` 将 core 内部事件转换为协议事件，TUI 可以渲染文本和审批，SDK 可以消费 JSONL，App Server 可以广播给多个客户端。阅读源码时建议从 `codex_thread.rs` 追到 `agent`，再追 `event_mapping` 和 `tools`。

## 源码入口

- `codex-rs/core/src/codex_thread.rs`：thread/turn 生命周期
- `codex-rs/core/src/context_manager.rs`：上下文组装和预算
- `codex-rs/core/src/compact.rs`：历史压缩
- `codex-rs/core/src/agents_md_manager.rs`：项目规则
- `codex-rs/core/src/exec.rs`：执行请求编排

下一章：[模型与通信协议](/codex/model-protocol)。
