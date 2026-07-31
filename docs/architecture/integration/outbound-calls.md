# 出站调用、Deadline、幂等与未知结果

外部调用跨越不可靠网络和组织边界。调用方无法仅从 timeout 判断供应商是否执行，因此必须将“结果未知”建模为正式状态，并用同一业务标识查询、回调和对账。

## 1. 出站调用管线

![外部出站调用的预算与状态管线](/architecture/integration-outbound-pipeline.svg)

流程：持久化意图/幂等 → 取得供应商凭证 → 映射/签名 → 获取隔离连接 → 调用 → 解析 HTTP/业务码 → 原子更新操作状态。数据库事务不包住慢 HTTP；可用操作记录/Saga 串联提交。

## 2. Timeout 分层

![连接、响应与总 Deadline 预算](/architecture/integration-timeout-budget.svg)

连接池获取、DNS、connect、TLS、response headers、body read 和总 deadline 分别有预算。总预算包含本地持久化和响应余量；供应商 SDK 内 timeout 必须小于上层 deadline。

超时太长占用线程/连接并拖垮调用方，太短会制造未知结果与无效重试。按接口 SLO 与实测延迟分布设置，不给所有供应商一个全局值。

## 3. 幂等键

内部 operation ID 稳定映射供应商 idempotency key，重试使用同 key 和相同请求指纹。相同 key 不同 Payload 本地先拒绝。记录供应商幂等保留时长；超过窗口后不能假定仍去重。

查询、回调和对账都关联 internal/provider request ID。供应商不支持幂等时，先本地唯一操作记录、限制自动重试并加强状态查询/人工确认。

## 4. 重试决策

只重试明确瞬时且请求幂等的错误；指数退避+jitter，限制次数和总 deadline。尊重 429 `Retry-After`。DNS、connect failure 可能尚未送达，read timeout 通常结果未知，不能一概相同。

SDK、HTTP Client、Service Mesh 和业务层只能有一个主重试责任，否则尝试次数乘法放大。

## 5. 未知结果收敛

![未知结果通过回调查询和对账收敛](/architecture/integration-unknown-resolution.svg)

`UNKNOWN` 后：短期等待回调；按退避主动查询；到业务 deadline 决定暂挂/限制后续动作；最终通过渠道账单对账。任何迟到结果进入同一状态机，使用外部版本/终态优先规则。

支付未知时不能告诉用户“失败”并允许换 key 再扣，也不能永远显示处理中。定义用户文案、客服工具和最大人工 SLA。

## 6. 连接池与 DNS

每供应商/主机隔离池、在途并发和队列。配置连接寿命、idle、keepalive、HTTP/2 streams 与 DNS TTL；IP 变更/故障转移时旧连接能逐步淘汰。TLS 必须校验证书和 hostname，不因排障永久关闭。

## 7. 请求与响应安全

限制响应 bytes、压缩比、JSON 深度和重定向；不跟随到未允许域名，防 SSRF。日志仅记录操作 ID、供应商、接口、状态类别、耗时和脱敏错误，不记录 Authorization、签名原文和完整个人数据。

## 8. 上线检查

- 每个有副作用调用是否先持久化 operation ID 和稳定幂等键？
- timeout 是否覆盖 acquire/DNS/connect/TLS/headers/body/总预算？
- read timeout 是否进入 UNKNOWN，而非错误断言供应商失败？
- 重试是否单层负责、错误分类正确、同 key 且受总预算约束？
- UNKNOWN 是否有回调、查询、对账和人工 SLA？
- 每供应商连接/并发是否隔离，DNS/TLS/响应大小是否受控？

下一篇：[Webhook 回调与幂等](/architecture/integration/webhooks)。
