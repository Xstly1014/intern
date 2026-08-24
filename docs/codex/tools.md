# 05 工具系统与文件修改

Agent 的价值在于改变工作区，而不是只生成建议。Codex 将命令、文件修改、搜索和外部服务都建模为工具，并通过统一的审批、执行和结果回传流程控制它们。

## 工具调用闭环

```text
模型提出 tool call
  -> 解析参数与目标资源
  -> 执行策略 / 审批判断
  -> 沙箱内运行
  -> 收集 stdout、stderr、文件变化
  -> 截断并结构化
  -> 回传模型继续决策
```

## Shell 与统一执行

`codex-rs/exec` 提供非交互执行入口，`core/src/exec.rs` 负责在 Agent 循环中组织执行，`exec-server` 将进程启动、PTY、退出码和流式输出封装为服务。命令需要考虑 shell 类型、工作目录、环境变量、信号、超时和平台差异。

## apply_patch

`apply_patch` 不是简单的字符串替换。它解析文件路径、上下文和增删块，检查目标文件是否符合预期，再以可审查的 diff 形式应用。失败时应报告上下文不匹配，而不是静默覆盖用户修改。

## 输出治理

测试日志可能远超上下文预算，因此工具结果需要按字节和行数截断，保留退出码、错误尾部和关键匹配。长 diff 应支持摘要和定位；敏感环境变量、token 和密钥不得进入模型上下文或日志。

## 源码入口

- `codex-rs/core/src/tools`：工具定义和调用
- `codex-rs/core/src/apply_patch.rs`：补丁解析与应用
- `codex-rs/exec`：exec CLI
- `codex-rs/exec-server`：进程执行服务
- `codex-rs/file-search`、`file-system`：文件能力

下一章：[审批与跨平台沙箱](/codex/sandbox)。
