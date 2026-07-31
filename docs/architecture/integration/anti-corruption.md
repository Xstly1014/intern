# 防腐层、内部端口、模型映射与契约治理

防腐层（ACL）保护内部业务语言不被供应商模型污染。它不只是 DTO Mapper，还包含协议、认证、金额时间语义、状态机、错误、幂等与版本差异的翻译。

## 1. 端口与适配器

![业务端口、防腐层与供应商适配器](/architecture/integration-anti-corruption.svg)

内部端口表达业务需要，例如 `PaymentAuthorizationPort.authorize()`；Stripe/支付宝/银行 Adapter 分别实现。用例依赖端口，不捕获供应商异常类，也不判断供应商字符串状态。

不要为了替换性给每个 SDK 方法机械包一层；端口应按内部业务能力设计，否则只是供应商 API 的转发代理。

## 2. 模型翻译

| 外部差异 | 内部统一方式 |
|---|---|
| 金额 minor unit/decimal | `Money(amount,currency)`，明确舍入 |
| 时间戳/时区 | Instant + 原始时区/业务日期 |
| 国家、地址、电话 | 标准化值对象并保留必要原值 |
| 状态码 | 内部状态 + 原始 provider status |
| ID | internalRequestId ↔ providerRequestId 映射 |
| 错误 | stable category + provider code/trace 摘要 |

不能把多个供应商所有状态硬塞成一个无损枚举。保留原始状态用于追查，同时将业务所需语义映射为 accepted/pending/final/unknown 等稳定类别。

## 3. 错误分类

![供应商响应到内部错误语义的映射](/architecture/integration-error-mapping.svg)

- 业务拒绝：余额不足、卡被拒，通常不自动重试。
- 参数/契约错误：本方 Bug 或数据问题，告警并隔离。
- 限流：尊重 Retry-After 和供应商配额。
- 瞬时技术失败：有限退避重试。
- 未知结果：请求可能已执行，查询/回调/对账收敛。
- 永久不可用：渠道停用、契约版本不支持，需要路由/人工处理。

供应商 200 也可能包含业务失败，5xx 也可能在执行后返回；HTTP 与业务结果分层解析。

## 4. SDK 隔离

供应商 SDK 只存在 Adapter Module。锁定版本、扫描依赖和许可证；SDK 线程池、重试、遥测和序列化默认值需显式核对，避免 SDK 与应用双重重试。升级用兼容样本和 Sandbox 回归，不让 SDK Entity 泄露到缓存/消息。

若 SDK 不支持 deadline、代理、证书轮换或安全配置，可直接使用受控 HTTP Client 实现必要协议。

## 5. 契约版本

供应商 API 版本固定，不使用自动 latest。记录弃用通知、最后支持日期、迁移 owner 和流量。升级期可双读/影子调用无副作用接口；有副作用请求不能无协议双发两个版本。

Webhook Schema 与出站 API 版本可能独立演进，按 event type/version 选择解析器，未知新版本隔离而非错误解析。

## 6. 可替换性边界

Adapter 可替换不代表业务可无感切换。不同渠道在支持币种、退款、清算、风控和最终一致性上有差异。内部 Capability Matrix 显式记录支持能力；用例根据能力选择，不用到处写 provider if/else。

## 7. 测试

- Mapper 使用脱敏黄金样本覆盖金额、时区、null、未知枚举和大数字。
- 错误映射覆盖 HTTP、业务码、timeout、坏 JSON 和限流 Header。
- 契约测试固定请求签名和响应 Schema。
- Sandbox 验证完整状态流，但不假设与生产所有边界一致。
- Provider Simulator 可稳定注入重复、乱序、慢响应和错误。

## 8. 上线检查

- 内部端口是否按业务能力而非供应商 API 设计？
- 金额、时间、状态、ID 和错误是否有无歧义映射？
- SDK 重试/线程/遥测是否与应用策略不重复冲突？
- API/Webhook 版本、弃用日期和迁移 owner 是否可见？
- Provider 特有能力是否通过 Capability Matrix 显式处理？
- 原始状态/证据是否可追查且不泄露敏感数据？

下一篇：[出站调用与未知结果](/architecture/integration/outbound-calls)。
