# Codex 源码与架构

Codex 是一个运行在本地计算机上的 AI 编程代理。它以 Rust 为核心实现，通过 CLI、终端界面、App Server、MCP 和 SDK 对外提供能力。

本专题按照“先理解产品，再进入运行时，最后深入安全与扩展”的顺序，梳理 `openai/codex` 仓库的核心内容。

## 学习路线

```text
产品定位
  -> 仓库结构
  -> CLI 与 TUI
  -> codex-core Agent 运行时
  -> 模型、协议与会话
  -> 工具执行、审批与沙箱
  -> App Server、MCP、插件与 Skills
  -> SDK、测试与构建发布
```

## 目录框架

### 01. 项目总览

- Codex 的产品边界：CLI、IDE、桌面端、云端 Agent 的关系
- Monorepo 目录结构与 Rust workspace
- 从用户输入到最终回复的完整请求链路
- 关键术语：thread、turn、item、tool、rollout、sandbox

### 02. CLI 与终端界面

- `codex-rs/cli` 的命令分发与生命周期
- 交互模式、`codex exec` 和 `codex review`
- `codex-rs/tui` 的事件循环、渲染和用户输入
- 登录、配置、诊断、更新和会话管理命令

### 03. codex-core Agent 运行时

- `codex-core` 的职责边界
- Thread、Turn 与 Agent 循环
- 上下文构建、压缩和 token 预算
- `AGENTS.md`、Skills 与项目上下文加载
- 事件映射、错误处理和任务收尾

### 04. 模型与通信协议

- ChatGPT 登录、API Key 与认证管理
- Model Provider 抽象与模型能力信息
- Responses API、流式响应和重试
- `protocol`、`codex-api` 与事件模型
- 结构化输出、图片输入和多轮对话

### 05. 工具系统与文件修改

- Shell、统一执行和 PTY
- `apply_patch` 的补丁模型与安全边界
- 文件搜索、文件系统访问和 Git 工具
- 工具调用的审批模板与 consequential actions
- 工具结果截断、超时和失败恢复

### 06. 审批与跨平台沙箱

- 沙箱策略：只读、工作区可写和细粒度文件系统权限
- Linux Landlock、Bubblewrap 与 WSL
- macOS Seatbelt
- Windows restricted token 与 elevated sandbox
- 网络访问策略、权限升级和 fail-closed

### 07. 会话、历史与状态

- `thread`、session 和 rollout 的关系
- 本地会话存储与恢复
- 历史记录、压缩后的上下文和 replay
- SQLite 状态、迁移与故障恢复
- 日志、反馈、诊断和遥测

### 08. App Server 与多端接入

- App Server 的定位和进程模型
- `app-server-protocol` 与 transport
- daemon、client 和 remote control
- CLI、桌面端、IDE 与 SDK 如何复用同一核心
- JSONL / JSON-RPC 事件流与生命周期

### 09. MCP、插件与 Skills

- MCP client/server 的连接模型
- 外部工具发现、调用和用户确认
- Plugin API、扩展点和内置 extension
- Skills 的加载、依赖和任务编排
- Web search、memory、image generation 等扩展能力

### 10. Python 与 TypeScript SDK

- SDK 如何启动和控制 Codex thread
- `run` 与 `runStreamed`
- 工作目录、配置覆盖和环境变量
- 结构化输出、图片附件和 thread 恢复
- 将 Codex 嵌入自动化和业务应用

### 11. 构建、测试与发布

- Cargo workspace 与 Bazel 目标
- 单元测试、集成测试、跨平台 exec 测试
- npm、Homebrew、安装脚本和 release artifact
- Linux、macOS、Windows 构建差异
- GitHub Actions、供应链和发布验证

### 12. 源码阅读实践

- 推荐阅读顺序和关键入口文件
- 如何跟踪一次完整 turn
- 如何新增工具、命令或扩展
- 如何修改权限策略并补充测试
- 如何定位模型、协议和沙箱问题

## 核心源码入口

| 主题 | 入口 |
| --- | --- |
| CLI | `codex-rs/cli/src/main.rs` |
| Agent 核心 | `codex-rs/core/src/lib.rs` |
| Thread | `codex-rs/core/src/codex_thread.rs` |
| 命令执行 | `codex-rs/core/src/exec.rs` |
| 文件补丁 | `codex-rs/core/src/apply_patch.rs` |
| 沙箱 | `codex-rs/sandboxing`、`codex-rs/linux-sandbox`、`codex-rs/windows-sandbox-rs` |
| App Server | `codex-rs/app-server`、`codex-rs/app-server-protocol` |
| MCP | `codex-rs/codex-mcp`、`codex-rs/mcp-server`、`codex-rs/ext/mcp` |
| SDK | `sdk/python`、`sdk/typescript` |

> 当前版本先建立目录和阅读路线；后续每一节再补充源码导读、时序图、数据结构和实战分析。
