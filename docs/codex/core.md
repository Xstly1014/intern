# 03 codex-core Agent 运行时

`codex-core` 是 Codex 的决策与执行中枢。CLI、TUI、App Server 和 SDK 都通过它共享同一套 thread、turn、上下文、工具和事件语义。

![codex-core Agent 状态循环](/codex/core-loop.svg)

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

## 6. 一次 Turn 的内部状态

Turn 并不是一个简单的 `request -> response` 函数，而是一个可暂停的状态机：

```text
Preparing
  -> WaitingForModel
  -> InspectingToolCall
  -> WaitingForApproval
  -> RunningTool
  -> ReturningToolOutput
  -> WaitingForModel
  -> Completed / Failed / Interrupted
```

`WaitingForApproval` 和 `RunningTool` 之间必须有明确边界。用户拒绝命令时，模型应收到“拒绝及原因”，而不是一个模糊的空结果；工具超时时，系统需要保留退出状态和部分输出，以便模型决定重试、缩小范围或改变方案。

## 7. Agent 如何避免盲目修改

Agent 通常先搜索和阅读，再修改和验证。这个顺序不是 prompt 中的一句口号，而是由工具结果、上下文和任务状态共同形成的反馈回路：

1. 搜索相关文件和符号，建立局部事实。
2. 读取配置、测试和项目规则，确认约束。
3. 生成最小补丁，并将 diff 暴露给用户或审批层。
4. 执行格式化、编译或测试。
5. 根据失败输出继续修复，直到满足验收条件。

如果上下文压缩丢失了“哪些测试已经通过”，模型就可能重复运行昂贵命令；如果工具结果没有带工作目录，模型也可能把相对路径解释错。因此 core 需要把执行元数据和结果一起封装。

## 8. 失败传播

core 会区分模型错误、用户中断、权限拒绝、工具失败、上下文超限和内部异常。不同错误的恢复方式不同：网络瞬断可以重试，权限拒绝应返回模型，用户取消应立即结束当前 turn，内部状态损坏则需要写入诊断信息并阻止继续使用坏状态。

## 9. 如何读测试

优先阅读 `core` 中带有 `turn`、`compact`、`exec_policy`、`event_mapping` 后缀的测试。它们比单纯的 happy path 更能说明设计边界，例如重复工具调用、审批后恢复、上下文预算不足和远程执行环境差异。
