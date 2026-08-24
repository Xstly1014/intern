# 04 模型与通信协议

Codex 将模型调用设计成流式、可重试、可扩展的协议，而不是把某个供应商的 HTTP 响应直接暴露给 UI。模型层负责“模型怎么说”，core 负责“说完后如何行动”。

## 分层关系

```text
codex-core
   -> codex-client / backend-client
      -> model-provider / model-provider-info
         -> Responses API / 代理 / 本地 provider
```

`codex-login` 管理 ChatGPT 登录和 API Key，`codex-model-provider` 提供供应商抽象，`codex-protocol` 和 `codex-api` 定义跨模块数据结构。

## 一次流式请求

1. 根据配置解析模型、服务等级、基础 URL 和认证来源。
2. 将系统 prompt、用户消息、工具 schema 和历史转换为 Responses API 请求。
3. 通过 SSE/流式 HTTP 消费文本增量、工具调用和完成事件。
4. 将供应商事件归一化为 Codex protocol 事件。
5. 对瞬时网络错误、限流和可重试服务错误执行退避。

| 事件类型 | 作用 | 使用方 |
| --- | --- | --- |
| 文本增量 | 更新最终回复或 transcript | TUI、SDK |
| 工具调用 | 请求 Shell、Patch、MCP 等动作 | core |
| 使用量 | 记录 token 和成本 | 状态、遥测 |
| 完成/错误 | 结束或重试 turn | CLI、App Server |

结构化输出通过 JSON Schema 约束最终结果；图片输入则在 SDK 层转换为文本项和本地图片参数，再由 CLI 传递给模型。

## 认证与安全

认证信息由 login/home 模块管理，不能混入普通日志和 rollout。API Key、access token、代理地址和组织信息需要经过脱敏；失败时要区分未登录、权限不足、配额耗尽和网络不可达。

## 阅读入口

- `codex-rs/model-provider`：provider 抽象
- `codex-rs/codex-client`：客户端请求
- `codex-rs/backend-client`：后端通信
- `codex-rs/responses-api-proxy`：Responses 代理
- `codex-rs/protocol`：事件和消息模型

下一章：[工具系统与文件修改](/codex/tools)。
