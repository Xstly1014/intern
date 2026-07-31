# 生产端可靠性、确认、Outbox 与重复发布

生产可靠性需要区分三个事实：业务数据库是否提交、Broker 是否持久化、生产者是否收到确认。任何两套独立系统的普通双写都会存在崩溃窗口。

## 1. 直接双写的失败矩阵

![数据库与 Broker 双写失败窗口](/architecture/middleware-dual-write-failure.svg)

先写库再发消息：进程可能在提交后、发送前崩溃，事实永远不通知。先发消息再写库：消费者可能处理一个最终不存在的业务事实。捕获异常和补发内存任务不能覆盖进程/机器故障。

## 2. Transactional Outbox

![Outbox Relay 发布与确认状态机](/architecture/middleware-outbox-relay.svg)

业务状态与 Outbox 行同本地事务提交。Relay 领取记录、发布、等待 Broker Confirm，再标记 published/推进日志位点。Confirm 丢失时会重复发送，所以 eventId 必须稳定，消费者必须幂等。

轮询实现简单可控；CDC 延迟低且避免频繁扫表，但引入日志连接器和 Schema/运维责任。两者都监控最老未发布年龄、失败次数和 Relay lease。

## 3. Producer Confirm / ACK

Broker ACK 的含义取决于产品和配置：写入 Leader 内存、落盘、多少副本确认、是否满足 ISR/Quorum。生产者设置 `acks`/publisher confirms、请求 timeout、delivery timeout 和有限重试；不能收到本地 send 成功就认为持久化。

发送超时表示结果未知：Broker 可能已接受但 ACK 丢失。使用同 eventId 重试，不生成新事件 ID。

## 4. Kafka 幂等与事务生产者

Kafka idempotent producer 可在 Producer Session 内通过 PID/sequence 减少重试重复；事务可原子写多个 Partition 并提交消费 offset，用于 consume-transform-produce。它不原子提交外部数据库或第三方 API，Outbox/业务幂等仍需要。

事务超时、producer fencing、长事务对读可见性和运维都有成本，不为“听起来更可靠”默认启用。

## 5. RabbitMQ 路由可靠性

Publisher Confirm 证明 Broker 接受；mandatory/return 或 alternate exchange 处理无路由消息。队列/消息持久化、Quorum/复制配置共同决定节点故障后的保留。Confirm 和 Return 是不同维度，必须分别处理。

## 6. 事件构造与提交

Outbox Payload 在业务事务内由已提交状态构造，保存 eventId、aggregate ID/version、type/schema、tenant、occurredAt、correlation 和数据分类。不在 Relay 临时重新查询拼事件，否则状态可能已变化且无法重现原事实。

敏感字段最小化，消息加密/权限按 Topic 分类；压缩不能用来容忍无限大事件。

## 7. Relay 并发与清理

用 SKIP LOCKED/租约或 CDC 分区实现多实例并发；锁定批次小，网络发送不长期持数据库事务。按分区 Key 保序时，不能让多个 Relay 交错同聚合版本。

Outbox 清理按审计与重放窗口分批执行，归档/分区避免表膨胀。published 标记不代表所有消费者处理成功。

## 8. 上线检查

- 是否消除了业务 DB 与 Broker 普通双写的静默丢失窗口？
- Broker ACK 配置究竟保证到内存、磁盘还是副本法定人数？
- 发送 timeout/confirm 丢失是否用同 eventId 安全重试？
- Outbox Payload 是否在业务事务内形成，包含稳定版本和最少数据？
- Relay 并发是否保持所需顺序，lease/崩溃可恢复？
- 未发布年龄、毒事件、表增长和清理是否可观测可运维？

下一篇：[消费、幂等、顺序与重平衡](/architecture/middleware/consumer-processing)。
