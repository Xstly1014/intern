# 消费处理、ACK、幂等、顺序与重平衡

消费者正确性取决于“业务提交”和“Broker 进度提交”的先后关系。处理成功后 ACK 可避免丢失，却天然产生重复；先 ACK 则可能永久丢失。

## 1. 崩溃窗口

![消费者业务提交与 ACK 的崩溃窗口](/architecture/middleware-consumer-ack-window.svg)

正确基线：接收 → 验证 → 本地事务去重并处理 → 提交业务 → ACK/offset。若在业务提交后 ACK 前崩溃，消息重投；Inbox/状态机返回已处理结果。若先 ACK 后业务提交，崩溃会永久丢业务效果。

## 2. Inbox 幂等

![Inbox 去重与业务效果的原子提交](/architecture/middleware-inbox-idempotency.svg)

在消费者数据库对 `(consumer, eventId)` 建唯一约束，Inbox 插入与业务更新同事务。重复事件冲突后读取原处理状态并 ACK。仅在 Redis 记录 eventId 不能与业务效果原子，TTL 到期后也会重新执行。

业务天然幂等优先，例如将状态从 PENDING 条件更新为 PAID；资金增加等非幂等动作必须以唯一交易 ID/账本约束。

## 3. 顺序与乱序

同 Key 同 Partition 只保证拉取顺序。并发异步处理、重试队列和下游事务时长可能改变完成顺序。需要顺序时每 Partition 单线程/有序执行，或用 aggregateVersion 在状态端拒绝旧版本、检测缺口。

不要让一条失败消息无限堵住整个分区。可暂停该 Key/Partition、短重试后隔离，但越过失败消息会放弃严格顺序，必须由业务版本机制接住。

## 4. Consumer Group 与并行度

![Consumer Group 分区分配与重平衡](/architecture/middleware-consumer-group.svg)

同 Group 内一个 Partition 同时由一个 Consumer 成员处理，因此最大并行通常受 Partition 数限制。实例数超过 Partition 不增加吞吐。单消息处理时间、poll batch、线程模型和下游容量共同决定消费率。

RabbitMQ 并行由 Queue Consumer 和 prefetch 控制；过大 prefetch 会让消息集中在慢实例并增加未 ACK 内存。

## 5. Rebalance 安全

Kafka Rebalance revoke 分区前停止接收新工作、等待/取消在途处理并提交已完成连续 offset。不能在后台线程仍处理旧 Partition 时让新成员同时处理，除非业务幂等可承受。

设置合理 `max.poll.interval`、`max.poll.records`、session timeout；长处理转工作池时仍要维护 offset 连续性和背压。静态成员/协作式重平衡可减少中断，但不消除正确处理 revoke 的责任。

## 6. 反序列化与未知消息

先验证大小、类型、Schema version 和必要 envelope。无法解析、未知不可兼容版本属于永久错误，不应无限原地重试。原始 Payload 放受控隔离存储，防敏感泄露；告警包含 eventId/Schema，而非完整 Body。

## 7. 外部副作用

消费者调用邮件/支付等外部系统时，使用业务幂等键并保存调用状态。HTTP timeout 结果未知，先查询供应商状态或同 key 重试。Inbox 只能保证本地处理一次，不能自动使外部系统 exactly-once。

## 8. 上线检查

- ACK/offset 是否只在业务事务成功后推进？
- Inbox/业务状态是否原子提交，保留期覆盖最大重放窗口？
- 同 Key 顺序是否会被工作池、重试或异步回调破坏？
- 分区/Consumer/prefetch 是否匹配真实下游容量？
- Rebalance revoke 时在途任务和连续 offset 是否正确处理？
- 外部副作用是否有供应商幂等键、未知结果查询和对账？

下一篇：[重试、延迟与死信](/architecture/middleware/retry-dlq)。
