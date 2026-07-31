# 外部集成层：隔离第三方协议、风险与不确定性

支付、物流、短信、地图、身份核验、ERP 和税务系统不由本团队控制。外部集成层以防腐层和适配器把供应商协议转换成内部稳定能力，并限制其超时、配额、错误、版本、安全与合规风险。核心目标不是“调通 API”，而是让外部不确定性最终收敛为内部可解释、可恢复的业务状态。

## 1. 运行时边界

![外部集成层运行时边界](/architecture/integration-runtime-boundary.svg)

| 参与方 | 拥有 | 不应拥有 |
|---|---|---|
| 业务服务 | 业务意图、状态机、最终结果、补偿 | 供应商 SDK DTO/错误码 |
| 集成端口 | 内部稳定 Request/Result 与错误分类 | HTTP、签名和厂商字段细节 |
| 供应商 Adapter | 协议、认证、映射、限流、幂等键 | 订单/支付领域规则 |
| Webhook Inbox | 原始验签事实、去重、接收状态 | 直接覆盖业务状态 |
| 对账流程 | 比较双方事实、差异和修复命令 | 无审计直接改数据库 |

业务层只认识 `AuthorizePayment`、`ShipmentStatus` 等内部语言。供应商从 v2 升 v3、状态码改名或切换渠道时，变化应局限于 Adapter 与映射测试。

## 2. 一次外部操作的完整闭环

![外部请求、回调、查询和对账闭环](/architecture/integration-operation-lifecycle.svg)

1. 业务用例创建稳定 internal request ID 与供应商幂等键，并持久化操作状态。
2. Adapter 映射字段、签名，在供应商独立连接池和 deadline 内发起请求。
3. 立即响应只表示 accepted/rejected/unknown，不一定是最终业务事实。
4. 超时/连接断开视为结果未知，不把它等同于失败并换 Key 重试。
5. Webhook 验签、去重、快速持久化，异步进入业务状态机。
6. 长时间无回调时主动查询，使用同一外部请求号关联结果。
7. 周期性账单/对账比较供应商权威流水与内部账本，收敛长尾差异。
8. 无法自动证明的差异进入带证据的人工工单。

## 3. 集成类型

| 类型 | 典型特点 | 首要风险 |
|---|---|---|
| 同步 API | 当前请求等待结果 | timeout 未知、429、级联 |
| Webhook | 对方异步推送结果 | 伪造、重复、乱序、回调风暴 |
| Poll/状态查询 | 主动收敛未知结果 | 配额、频率、陈旧状态 |
| 消息/事件桥接 | 跨组织异步集成 | Schema、重复、权限、保留 |
| SFTP/文件交换 | 批量、日终、遗留系统 | 完整性、部分导入、重跑 |
| 人工门户/工单 | 无 API 或异常处理 | 权限、证据、审计、时效 |

同一供应商常同时使用 API + Webhook + 对账文件，三者是互补闭环，不是重复实现。

## 4. 结果状态模型

![外部操作内部状态机](/architecture/integration-operation-state.svg)

建议显式区分 `CREATED`、`SUBMITTED`、`PENDING`、`SUCCEEDED`、`REJECTED`、`UNKNOWN`、`REVERSING`、`NEEDS_ATTENTION`。HTTP 200、供应商 `accepted=true` 和内部 `SUCCEEDED` 是不同概念。

状态转换保存 source、外部事件 ID/版本、发生时间和证据摘要。迟到回调根据当前状态和供应商序列/业务版本处理，不能按到达顺序覆盖。

## 5. 关键设计原则

- 每次外部动作有内部请求号、外部请求号、幂等键和 correlation。
- 供应商错误映射为业务拒绝、参数错误、瞬时失败、限流、未知结果和永久技术失败。
- 请求重试、Webhook、主动查询与对账共享同一状态机。
- 每供应商隔离连接池、线程/并发、限流、熔断和指标。
- 出站最少披露数据，入站先验签再解析，Secret 可轮换。
- 多供应商路由不绕过用户同意、清算、状态和对账边界。

## 6. 本章专题

| 专题 | 深入内容 |
|---|---|
| [防腐层、模型与契约](/architecture/integration/anti-corruption) | 端口、Adapter、状态/错误映射、版本和 SDK 隔离 |
| [出站调用与未知结果](/architecture/integration/outbound-calls) | deadline、幂等、重试、连接池、状态查询 |
| [Webhook 回调与幂等](/architecture/integration/webhooks) | 原始 Body 验签、重放、Inbox、乱序和 ACK |
| [身份、签名与数据合规](/architecture/integration/security-compliance) | OAuth/mTLS/HMAC、Secret 轮换、最少数据和审计 |
| [韧性、配额与多供应商](/architecture/integration/resilience-routing) | 舱壁、429、健康评分、路由、切换与回切 |
| [文件、批量与对账集成](/architecture/integration/batch-reconciliation) | SFTP/对象文件、Manifest、部分失败、重跑和差异修复 |
| [Java 生产参考架构](/architecture/integration/reference) | Spring HTTP Client、容量、观测、测试、发布与演练 |

## 7. 最小上线基线

- 外部 DTO、错误码和 SDK 不进入领域模型。
- 所有有副作用请求使用稳定幂等键，timeout 按结果未知处理。
- Webhook 在解析前验原始 Body，防重放、幂等、快速 ACK。
- API、回调、查询和对账汇入同一业务状态机。
- 每供应商有隔离池、配额、deadline、重试预算和降级语义。
- Secret 有 owner、用途、版本、轮换与紧急撤销手册。
- 未知状态、对账差异和人工处理有 SLO、证据与审计。

下一篇：[防腐层、模型与契约](/architecture/integration/anti-corruption)。
