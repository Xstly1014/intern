# 04 模型与通信协议

Codex 将模型调用设计成流式、可重试、可扩展的协议，而不是把某个供应商的 HTTP 响应直接暴露给 UI。模型层负责“模型怎么说”，core 负责“说完后如何行动”。

![Codex 的协议与扩展边界](/codex/protocol-boundaries.svg)

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

## 6. 为什么采用事件协议

模型响应包含多个时间维度：文本可能先到，工具参数稍后才完整，最终 usage 还要等服务端结束。事件协议让上层可以增量显示，也允许工具执行在一次模型响应结束后继续推进。

```text
response.created
  -> output_text.delta * N
  -> function_call.arguments.delta * N
  -> response.output_item.done
  -> response.completed
```

Codex 会把供应商事件映射成内部事件，避免 TUI 和 SDK 依赖某个 API 的字段命名。协议设计时还要考虑事件顺序、重复通知、未知事件和向后兼容。

## 7. 重试不能只看 HTTP 状态码

429 通常意味着限流，500 可能是服务暂时故障，但一个已经产生副作用的工具调用不能无条件重放。重试策略需要知道请求是否已被服务端接受、是否带幂等标识、流是否已经输出了工具参数，以及模型是否支持从部分响应继续。

| 场景 | 建议 |
| --- | --- |
| 建连失败 | 指数退避并限制次数 |
| 429 | 尊重 Retry-After，降低并发 |
| 流中断且无工具副作用 | 可重试 |
| 工具调用已发出 | 先查询状态或交给模型判断 |
| 认证失败 | 不重试，提示重新登录 |

## 8. 模型配置如何进入请求

配置解析要处理 profile、命令行覆盖、环境变量和托管策略的优先级。最终请求应记录选中的 provider、模型、服务等级和是否启用工具，但不能记录 token。模型能力信息还会影响是否暴露图片、结构化输出和并行工具能力。

## 9. 协议排障方法

出现“模型没响应”时，按顺序检查认证、DNS/TLS、HTTP 状态、流解析、事件映射和 core 状态转移。不要只看最终 TUI 文本；开启调试日志后，重点核对 request id、turn id、event sequence 和 usage。
