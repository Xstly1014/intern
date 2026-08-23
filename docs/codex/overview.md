# 01 项目总览：从命令行到 Agent 运行时

Codex 不是一个“把聊天窗口放进终端”的薄客户端，而是一套运行在开发者本机上的 Agent 运行时：模型负责提出下一步行动，Codex 负责把行动放进真实的工作区、权限和进程环境中执行，并把结果持续反馈给模型。

这一点决定了仓库的重点不只是模型请求。真正复杂的工程问题包括：如何维持多轮上下文、如何让工具调用可审计、如何限制文件和网络权限、如何跨 Linux/macOS/Windows 执行、如何让 CLI、IDE、桌面端和 SDK 共享同一套核心逻辑。

## 1. 先建立正确的产品边界

![Codex 本地 Agent 运行时全景](/codex/runtime-overview.svg)

图中的“接入层”与“运行时”是两个容易混淆的边界：

- **接入层**负责把用户、IDE 或 SDK 的输入转换成 Codex 能处理的请求，并把事件渲染或转发出去。它可以变化，但不应复制 Agent 决策逻辑。
- **codex-core**负责一次任务如何推进：准备上下文、调用模型、暴露工具、处理工具结果、压缩上下文并决定是否结束。
- **执行与安全层**负责把模型要求变成受控的本地动作。模型可以请求运行命令，但不能绕过审批和沙箱直接获得宿主机能力。
- **状态层**负责让一次对话可以继续、恢复、回放和诊断，而不是随着终端退出就完全消失。

因此，Codex CLI、桌面应用和 SDK 是不同的“前门”，不是三个独立的 Agent 产品。

## 2. 仓库为什么采用 Monorepo

仓库顶层的 [`codex-rs/Cargo.toml`](https://github.com/openai/codex/blob/main/codex-rs/Cargo.toml) 定义了一个大型 Rust workspace。多个 crate 共享版本、依赖和 lint 配置，同时又保留清晰的职责边界。

| 层次 | 代表目录 | 解决的问题 |
| --- | --- | --- |
| 产品入口 | `codex-rs/cli`、`codex-rs/tui` | 命令解析、终端交互、登录和诊断 |
| Agent 核心 | `codex-rs/core`、`codex-rs/core-api` | Thread、Turn、上下文、工具编排 |
| 模型通信 | `codex-rs/codex-client`、`model-provider` | 请求、流式响应、模型能力和重试 |
| 执行控制 | `exec`、`exec-server`、`execpolicy` | Shell 进程、策略判断、执行服务 |
| 安全隔离 | `sandboxing`、`linux-sandbox`、`windows-sandbox-rs` | 文件系统、网络和平台沙箱 |
| 对外协议 | `protocol`、`app-server-protocol` | 统一事件、请求响应和跨进程通信 |
| 扩展能力 | `ext/*`、`mcp-server`、`skills` | MCP、插件、记忆、搜索和自定义能力 |
| 持久化 | `history`、`thread-store`、`state`、`rollout` | 会话恢复、状态数据库、运行记录 |

这种拆分的直接收益是：TUI 可以替换而不影响核心循环，Windows 沙箱可以独立演进，SDK 可以依赖稳定协议而不是绑定内部 Rust 类型。

## 3. 一次任务究竟发生什么

![一次 Codex Turn 的执行闭环](/codex/turn-lifecycle.svg)

用户输入“修复这个测试失败”后，系统通常按下面的顺序推进：

### 3.1 接收请求

CLI 或 SDK 收集 prompt、工作目录、模型、权限模式、配置覆盖和可选图片。交互模式下，终端输入会被 TUI 转成内部事件；SDK 则通过 CLI 或 App Server 的结构化协议提交请求。

### 3.2 建立上下文

Codex 会确定当前工作区，加载项目规则（例如 `AGENTS.md`）、会话历史、可用 Skills、工具清单和模型能力。这里的目标不是把整个仓库无差别塞给模型，而是构造“当前任务所需的最小有效上下文”。

上下文过长时，`core` 中的 compact 相关模块会压缩历史；压缩必须保留任务目标、已完成动作、失败原因和仍然有效的约束，否则模型会在后续 turn 中重复劳动或违反项目规则。

### 3.3 调用模型并消费流式事件

模型响应不是单个字符串，而是一组逐步到达的事件：文本增量、推理状态、工具调用、工具参数和完成信号。Codex 将这些事件映射为 CLI、TUI、App Server 和 SDK 可以消费的统一事件。

### 3.4 处理工具调用

模型提出 Shell、文件补丁或 MCP 调用后，核心层先判断该动作是否需要用户确认，再选择对应执行器。命令输出会经过截断、错误归类和上下文包装，然后返回模型继续决策。

关键点是“工具调用是循环的一部分”，而不是模型回复后的附加脚本：模型可以根据测试结果修改代码、再次运行测试，直到达到完成条件或明确报告阻塞。

### 3.5 保存结果并结束 turn

完成后，Codex 保存消息、工具结果、状态和 rollout 记录。下一次 turn 可以复用同一 thread；出现异常时，也能利用历史和诊断信息恢复，而不是只剩终端上的一段文本。

## 4. 核心对象：Thread、Turn、Item

| 对象 | 含义 | 生命周期 |
| --- | --- | --- |
| Thread | 一条可持续恢复的工作会话，包含上下文和历史 | 可跨进程、跨时间恢复 |
| Turn | 用户发起的一轮任务推进 | 从接收 prompt 到模型完成或失败 |
| Item | turn 内的结构化事件，如消息、工具调用、文件变更 | 流式产生，可被 UI/SDK 消费 |
| Rollout | 对一次运行过程的持久化记录 | 用于恢复、回放、调试和分析 |

可以把它们理解为：Thread 是“项目工作台”，Turn 是“本次任务”，Item 是“任务日志中的一条事件”。这个层次划分让 Codex 既能做一次性 `exec`，也能支持长时间、多轮的工程协作。

## 5. 工具能力与安全边界

Codex 的本地能力不是一个无限权限的 `shell=True`。每次执行都要经过策略层：

1. 识别动作类型和目标资源。
2. 根据配置、平台和当前沙箱判断是否允许。
3. 对高风险或越权动作请求用户审批。
4. 在受限进程、受限文件根目录和受限网络中执行。
5. 将退出码、stdout、stderr 和文件变化作为结构化结果返回。

这套设计解决两个相反的问题：Agent 必须足够有能力完成真实开发任务，同时又不能因为一次错误生成的命令破坏整个宿主环境。关于平台差异，详见后续“审批与跨平台沙箱”章节。

## 6. 四种接入方式的关系

| 接入方式 | 适合场景 | 与核心的关系 |
| --- | --- | --- |
| CLI/TUI | 人在终端直接开发 | 直接调用 Rust 核心并负责交互渲染 |
| App Server | 桌面端、IDE、远程控制 | 通过协议暴露 thread、turn 和事件流 |
| Python SDK | Python 自动化、内部工具 | 封装进程/协议，提供 Python 对象模型 |
| TypeScript SDK | Node.js、Electron、Web 工具 | 通过 JSONL 调用 CLI，提供异步 API |

它们共享模型、工具、审批和状态语义。新增一个前端时，优先复用 App Server 协议或 SDK，而不是重新实现一遍 Agent 循环。

## 7. 读源码时的主线

建议沿着一条真实请求追踪，而不是从数百个 crate 的目录名开始背：

1. 从 [`codex-rs/cli/src/main.rs`](https://github.com/openai/codex/blob/main/codex-rs/cli/src/main.rs) 看命令如何进入交互或 `exec`。
2. 进入 [`codex-rs/core/src/codex_thread.rs`](https://github.com/openai/codex/blob/main/codex-rs/core/src/codex_thread.rs)，理解 thread/turn 的边界。
3. 顺着 `core/src/agent`、`context_manager` 和 `event_mapping` 看模型循环。
4. 进入 `core/src/exec.rs`、`apply_patch.rs` 和 `tools` 看动作如何执行。
5. 再看 `execpolicy`、`sandboxing` 和平台沙箱，理解为什么同一命令在不同系统上路径不同。
6. 最后阅读 `app-server-protocol`、MCP 和 SDK，理解内部能力如何稳定地对外暴露。

## 8. 当前专题的后续章节

本页建立的是源码地图，不替代具体模块分析。后续文章会分别展开 CLI/TUI、Agent 循环、模型协议、工具执行、沙箱、状态管理和扩展系统，并为关键流程补充时序图、数据结构和测试入口。

下一篇：[Codex 专题目录](/codex/)，后续将继续补充 CLI 与终端界面章节。
