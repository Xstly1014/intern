# Webhook 验签、重放防护、Inbox 与乱序处理

Webhook 是供应商主动调用的公网入口，必须同时处理真实性、完整性、重放、重复、乱序和回调风暴。HTTP 到达顺序不等于业务发生顺序。

## 1. 安全接收管线

![Webhook 从原始请求到异步业务处理](/architecture/integration-webhook-pipeline.svg)

1. 边缘限制 Body、连接、速率和允许协议，不用 IP 白名单作为唯一认证。
2. 捕获原始 bytes；按供应商规范对原始 Body、时间戳和路径验签。
3. 校验 timestamp 窗口、nonce/event ID，防止旧请求重放。
4. 验证 Content-Type、Schema/事件类型和必要字段。
5. Inbox 以 provider+eventId 唯一保存原始摘要、接收时间和处理状态。
6. 按供应商要求快速返回 ACK，再异步调用业务用例。

验签前重新序列化 JSON 会改变空格/字段顺序导致签名错误；必须保留原始 Body。

## 2. 签名验证

![Webhook HMAC 签名和密钥轮换验证](/architecture/integration-webhook-signature.svg)

严格选择允许算法，恒定时间比较 MAC，校验 key ID。轮换期验证方同时接受 active/previous key，签发方切新后等待最大回调重试窗口再撤旧。未知 key 不动态访问请求提供的任意 URL。

若供应商使用非对称签名，固定可信 JWK/cert 来源、缓存和刷新策略；mTLS 可证明连接客户端，但仍建议消息级签名防代理链变化。

## 3. 快速 ACK 与可靠处理

HTTP 内只完成验签和持久化，不调用多个业务下游。保存成功才 ACK；持久化失败返回供应商约定的可重试响应。重复 eventId 返回成功，避免供应商持续重发，但不重复业务效果。

Inbox Worker 使用 lease/状态领取，处理成功记录业务结果。业务提交后 Worker 崩溃会重跑，因此用例仍需幂等。

## 4. 乱序与状态机

![Webhook 重复与乱序进入业务状态机](/architecture/integration-webhook-ordering.svg)

使用 provider sequence、object version、发生时间和终态规则，而非 receive time。退款成功先到支付成功等异常序列可能需要暂存、主动查询或进入待核对。旧版本不得覆盖新终态。

同一对象可按 Key 串行处理，但不能假设供应商永远顺序发送；版本防线仍保留。

## 5. 回调风暴

供应商因 ACK 慢会指数重试。入口按供应商/事件限流但为关键回调预留容量；Inbox 与 Worker 解耦；重复快速命中去重。积压按最老回调年龄和业务 deadline 告警。

不要在故障时统一返回 200 丢事件，也不要返回 500 让永久坏 Payload 无限攻击。

## 6. Payload 保存

保存完整原文需数据分类、加密、访问控制和短保留；也可保存哈希、签名字段和必要证据，原文放受控对象存储。日志不打印回调 Body/签名/个人数据。

## 7. 运维工具

可按 eventId/provider object ID 查看接收、验签、去重、处理和业务状态；支持安全重放内部处理，不伪造外部签名。永久坏 Schema 隔离，修复后按原 eventId 限速重放。

## 8. 上线检查

- 是否对原始 bytes 验签，严格算法、时间戳、nonce 和 key ID？
- Inbox 持久化成功后才 ACK，重复事件是否快速成功且无重复效果？
- 业务处理是否脱离 HTTP，并有 lease、状态和重放？
- 乱序是否按 provider version/业务状态处理，而非到达顺序？
- 回调风暴是否有独立容量、限流和最老年龄告警？
- 原始 Payload 的保存、加密、访问、保留和删除是否合规？

下一篇：[身份、签名与数据合规](/architecture/integration/security-compliance)。
