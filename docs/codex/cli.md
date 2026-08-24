# 02 CLI 与终端界面：把 Agent 变成可操作的开发工具

Codex 的 CLI 不是一个只负责打印模型文本的壳。它承担三类工作：把 shell 参数和环境转换成明确的运行配置，把用户选择路由到交互或自动化执行路径，再把 Agent 的异步事件变成终端里可理解、可操作、可恢复的界面。

## 1. CLI 与 TUI 的分层

![Codex CLI 与 TUI 的分层关系](/codex/cli-tui-architecture.svg)

入口文件是 [`codex-rs/cli/src/main.rs`](https://github.com/openai/codex/blob/main/codex-rs/cli/src/main.rs)。其中 `MultitoolCli` 聚合全局选项、交互选项和 `Subcommand`，子命令覆盖 `exec`、`review`、`login`、`mcp`、`plugin`、`app-server`、`sandbox`、`doctor` 等。没有显式子命令时，参数会进入交互式 TUI；有 `exec` 时，则进入适合脚本和 CI 的非交互路径。

这个边界很重要：CLI 决定“怎么启动”，TUI 决定“怎么交互”，`codex-core` 决定“Agent 如何完成任务”。如果把三者混在一起，后续新增桌面端、SDK 或远程控制时就会复制大量逻辑。

## 2. 启动阶段：参数不是孤立的字符串

一次启动通常要合并多层输入：

| 输入来源 | 示例 | 作用 |
| --- | --- | --- |
| 子命令和参数 | `codex exec --json` | 选择执行模式和输出协议 |
| 全局配置 | `--config model=...` | 覆盖模型、权限、网络等行为 |
| 环境变量 | `CODEX_HOME`、认证变量 | 指定状态目录和认证来源 |
| 工作目录 | 当前目录或显式目录 | 决定 Git 检查、项目规则和文件范围 |
| 终端能力 | TTY、颜色、窗口大小 | 决定是否启用交互界面和渲染能力 |

CLI 先完成解析，再加载配置、认证和运行环境。这样做能避免一个常见错误：程序已经创建了 Agent 或打开了文件，才发现用户实际要求的是 `--json`、只读沙箱或另一个工作目录。

## 3. 交互模式：TUI 为什么需要自己的状态机

![TUI 事件循环](/codex/tui-event-loop.svg)

TUI 不是“在循环里 `read_line` 然后打印结果”。它需要同时处理键盘输入、模型流式事件、工具执行结果、审批请求、终端 resize、粘贴、外部编辑器和后台任务。因此 `codex-rs/tui/src/app.rs` 维护应用级状态，`app_event.rs` 定义内部事件，`chatwidget.rs` 负责输入区和会话交互，`thread_transcript.rs`、`markdown.rs` 等模块负责消息和 Markdown 展示。

一次交互 turn 的典型状态变化是：

```text
空闲
  -> 用户编辑 prompt
  -> 提交 turn
  -> 等待模型 / 显示状态指示
  -> 收到文本或工具调用
  -> 工具审批（必要时）
  -> 工具运行 / 显示进度
  -> 结果回传模型
  -> 继续循环或完成
  -> 回到可输入状态
```

TUI 的关键设计是把“状态更新”和“渲染”分开。后台事件只改变应用状态，渲染层根据当前状态生成终端画面；这样流式文本到达、窗口变窄或用户滚动历史时，不会互相覆盖。

## 4. 输入体验：Prompt、快捷键与 Slash Command

输入区需要解决的不是简单换行，而是工程任务的编辑效率：

- 多行 prompt 和粘贴内容不能因为回车策略而误提交。
- 光标移动、历史记录和草稿恢复要在终端尺寸变化后仍然稳定。
- `/` 开头的 slash command 可以触发模型、配置、会话、审批或 UI 操作，而不必让模型解释一遍。
- 图片、文件引用和工作区路径需要转换成结构化输入，避免把不可解析的路径文本混入普通消息。
- 外部编辑器和剪贴板能力要根据平台和终端能力降级。

这些功能解释了 TUI 中大量看似“界面细节”的模块：`keymap`、`motion`、`insert_history`、`external_editor`、`clipboard_paste`、`mention_codec` 和 `slash_command`。它们共同把终端变成一个可持续使用的开发工作台。

## 5. 输出体验：模型流不是日志流

模型响应是增量事件，终端却需要稳定的可读内容。Codex 因此要处理：

1. 将文本增量合并为消息片段，避免每个 token 都造成完整屏幕重绘。
2. 对 Markdown 进行流式解析，在代码围栏尚未闭合时仍保持合理显示。
3. 在工具调用前后显示明确的阶段、命令和结果，区分“模型正在思考”和“本地命令正在运行”。
4. 对长输出、diff、表格和窄终端进行截断、折叠和重排。
5. 保留可复制、可滚动和可定位的 transcript，而不是只保留最后几行。

`ratatui` 提供布局和 widget，`crossterm` 负责跨平台终端事件与控制序列，`markdown`、`markdown_stream`、`transcript_reflow` 和 `diff_render` 则把 Agent 事件转换为人能读懂的内容。

## 6. 审批是交互协议的一部分

当 Agent 请求执行高风险命令、修改文件或访问额外资源时，TUI 不能只打印一行“是否继续”。审批界面必须告诉用户：要执行什么、影响哪些资源、当前沙箱是什么、允许是一次性的还是对同类命令持续有效。

因此审批请求会进入与普通 Agent 事件不同的交互状态；用户的选择再通过协议返回执行层。`pending_interactive_replay`、`approval_events` 和 thread routing 相关代码负责在异步事件、界面重绘和恢复会话之间保持审批状态一致。

## 7. `codex exec`：面向自动化的另一条路径

`codex exec` 不依赖 TUI，而是强调确定的输入、输出和退出状态，适合：

- CI 中让 Agent 分析失败日志
- 批量代码审查和仓库检查
- Shell 脚本或其他程序调用 Codex
- 不支持交互终端的容器和自动化环境

它仍然复用 `codex-core`、模型协议、工具和沙箱，但输出会更偏向纯文本或 JSON，审批策略也必须通过配置或预先授权解决。这里的工程重点是：stdout 不能混入装饰性 UI，退出码要能被上游程序判断，长输出要有稳定截断规则，错误要落到可诊断的结构化信息中。

## 8. `resume`、`fork` 与会话连续性

CLI 还承担会话生命周期管理。`resume` 让用户回到已有 thread，继续上下文和工作目录；`fork` 则从某个历史状态派生新的工作分支，适合尝试另一种修复方案。它们不是简单读取一段聊天记录，而是要恢复模型上下文、配置、工具权限、未完成的交互请求和 rollout 状态。

这也是为什么 CLI、TUI 和 `thread-store` 必须共享稳定的 ID、事件和状态结构。一个漂亮的终端界面，如果退出后无法准确恢复任务，就不适合长期工程协作。

## 9. 源码阅读路线

建议按下面的顺序阅读：

1. `codex-rs/cli/src/main.rs`：看 `MultitoolCli`、`Subcommand` 和 `run_interactive_tui`。
2. `codex-rs/tui/src/cli.rs`：看 TUI 参数如何定义并注入 CLI。
3. `codex-rs/tui/src/tui.rs`、`app.rs`：看终端初始化、主应用状态和退出处理。
4. `codex-rs/tui/src/app_event.rs`、`app_event_sender.rs`：看事件如何进入 UI。
5. `chatwidget.rs`、`thread_transcript.rs`、`markdown_stream.rs`：看输入、输出和流式渲染。
6. `approval_events.rs`、`pending_interactive_replay.rs`：看审批和恢复场景。
7. `codex-rs/exec/src/main.rs`：对比非交互执行的输入、输出和退出码。

阅读时可以用一个问题串起所有文件：**一个工具调用从模型事件产生，到用户审批，再到命令结果回到 transcript，经过了哪些状态和协议边界？**

## 10. 设计取舍总结

Codex CLI/TUI 的核心取舍可以概括为：

- CLI 保持明确的命令和退出语义，TUI 提供高密度的持续交互。
- TUI 优先响应输入，后台 Agent 事件通过队列进入状态机。
- 输出优先可读和可恢复，而不是把原始模型流直接倾倒到终端。
- 审批和沙箱是用户体验的一部分，因为安全决策必须可理解、可操作。
- 交互层不复制 Agent 业务逻辑，所有入口共享 `codex-core` 和协议。

这套设计让 Codex 既能作为开发者每天使用的终端工具，也能作为 CI、SDK 和桌面端的 Agent 引擎。

下一篇：[Codex 专题目录](/codex/)，后续将继续补充 Agent 运行时章节。
