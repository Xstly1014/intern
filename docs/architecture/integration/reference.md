# Java 外部集成生产参考架构

参考架构将业务状态机、Provider Adapter、凭证、出站资源、Webhook Inbox、状态查询和对账分开，使请求、回调、文件与人工修复最终汇入同一操作事实。

## 1. 生产参考拓扑

![Java 外部集成生产参考拓扑](/architecture/integration-reference-topology.svg)

- 业务服务通过内部 Port 调用 Provider Adapter，不依赖 SDK DTO。
- Operation Store 保存 internal/provider ID、幂等、状态、证据和渠道归属。
- 每 Provider 独立 HTTP Client/池/舱壁/配额/熔断和 Secret。
- Webhook Gateway 验签并写 Inbox，Worker 异步推进相同状态机。
- Query/Poll 和 Reconciliation 收敛 timeout、漏回调与长尾差异。
- Provider Simulator/Sandbox/契约样本支持故障和兼容测试。

## 2. Spring HTTP Client 基线

RestClient/WebClient/Java HttpClient 任选与项目编程模型一致的实现。显式配置 connect、response、总 deadline、连接池、最大响应、重定向、代理、TLS、DNS/连接寿命和可观测拦截器。

WebFlux 只在整条调用链非阻塞时有价值；虚拟线程简化阻塞调用，但都不能替代供应商并发舱壁。不要让 SDK 隐式创建无界线程池或覆盖全局 SSL 验证。

## 3. Operation Store

![外部操作记录与多信号状态汇聚](/architecture/integration-operation-store.svg)

记录 operation ID、business key、provider/attempt、request fingerprint、idempotency key、provider ID、状态/version、deadline、last error、next query、回调版本和对账状态。状态更新用 version/CAS，防请求响应、Webhook 和 Poll 并发覆盖。

敏感原文放受控对象存储或短期保留，表中存哈希/摘要。查询索引支持 provider ID、业务 ID、UNKNOWN oldest 和对账批次。

## 4. 可观测模型

![外部调用到最终业务结果的观测链](/architecture/integration-observability.svg)

按 provider/API/version 记录请求率、连接/TTFB/总延迟、HTTP/业务错误、429、重试、熔断、UNKNOWN；Webhook 记录验签失败、重复、最老 Inbox、发生到接收/处理延迟；对账记录差异数量与金额、未决年龄和人工 SLA。

技术 200 不能计为最终成功。业务 SLI 从 operation 创建到 SUCCEEDED/REJECTED/NEEDS_ATTENTION 的终态与耗时定义。

## 5. 测试矩阵

| 层次 | 必测内容 |
|---|---|
| Mapper | 金额、时区、null、未知枚举、错误映射 |
| 契约 | 请求/响应/Webhook Schema、签名样本、版本兼容 |
| Simulator | timeout、429、5xx、坏 JSON、慢 Body、重复乱序 |
| Sandbox | 真实认证、完整状态流、退款/取消和配额 |
| 安全 | 签名绕过、重放、SSRF、Secret 轮换、敏感日志 |
| 崩溃 | 请求提交前后、响应丢失、Inbox commit/ACK 前后 |
| 对账 | 漏回调、金额不符、重复、未知与安全重放 |

生产不可复现协议问题时使用脱敏、加密、限时访问的样本，不把完整 Payload 粘贴到工单。

## 6. 发布与变更

Provider API/证书/签名变更先在 Sandbox/模拟器验证，再 canary 少量无风险或幂等流量。Adapter 新旧版本并存时 Operation 记录使用版本，未完成操作继续由原版本/渠道收敛。

Secret/证书轮换采用双信任窗口；Webhook 新旧 key 同时验证。变更同时观察 UNKNOWN、回调延迟和对账差异，不只看 HTTP 错误。

## 7. 故障演练

- connect/read timeout 且供应商实际成功，系统通过回调/查询收敛且无重复。
- 回调重复、乱序、延迟、错误签名和 key 轮换。
- 429/配额耗尽时优先级、退避和备用路由正确。
- Provider 全挂不耗尽全局池，恢复后渐进放量。
- 对账文件迟到/重复/部分坏行可安全补跑。
- Secret 泄露可快速撤销、切新并定位使用范围。

## 8. 完整评审清单

### 模型与正确性

- 内部 Port、Provider Adapter、Operation 状态机是否边界清楚？
- 有副作用请求、回调、查询和对账是否共享 ID/版本/幂等？
- timeout、迟到和乱序是否不会误报失败或重复执行？

### 安全与合规

- 出站身份、Webhook 签名、Secret 轮换、SSRF 和最少数据是否完整？
- 日志、Inbox、DLQ、文件、Sandbox 和支持工具是否保护敏感数据？
- 供应商数据保留、地域、删除和退出是否可执行？

### 韧性与运营

- 每 Provider 是否隔离资源、配额、deadline、重试和健康路由？
- UNKNOWN、回调积压、对账差异和人工工单是否有 SLO？
- 协议升级、渠道切换、Secret 泄露和全站故障是否演练？

下一层是[可观测与运维层](/architecture/observability)：外部集成输出统一技术与业务信号，运维层负责跨系统关联、告警和事件处置。
