# 流控、背压、消息积压与容量规划

异步系统把瞬时压力转换成队列长度和等待时间，但没有消除工作量。若长期生产速率大于消费能力，积压必然无限增长；若恢复追赶没有额外余量，系统永远回不到稳态。

## 1. 基本容量模型

![生产速率、消费速率与积压变化](/architecture/middleware-lag-dynamics.svg)

```text
积压变化率 = 生产速率 + 重试回流速率 - 成功消费速率
追赶时间 ≈ 当前积压 /（安全消费能力 - 当前生产速率）
```

平均 1,000 msg/s、消费安全能力 1,100 msg/s 只有 100 msg/s 追赶余量；积压 360 万条需约 10 小时。容量必须按峰值、故障时长、消息大小、处理成本和下游限制计算。

## 2. Lag 与最老消息年龄

条数 Lag 无法直接表达用户影响：消息大小和处理成本不同，低流量 Topic 卡一条关键消息也可能严重。至少监控 records/bytes lag、oldest age、端到端 event age、生产/成功/失败率和业务 deadline 逾期。

Kafka 按 Group/Topic/Partition 观测；RabbitMQ 看 ready/unacked、publish/deliver/ack rate 和消费者利用率。

## 3. 背压链路

![从下游容量到生产入口的背压传播](/architecture/middleware-backpressure.svg)

消费者按下游数据库/HTTP 安全并发限制 poll/prefetch 和 Worker 队列；本地队列满时暂停 Partition/停止拉取，而非继续堆内存。Broker 达到磁盘/配额水位时限制 Producer；入口按业务优先级降载。

背压要能跨层传播。单纯给 Consumer 加无界线程池会隐藏压力，最终以 OOM、连接池耗尽或超时风暴失败。

## 4. 扩容限制

Kafka Group 最大有效并行受 Partition 数限制；增加 Partition 可提高并行，但改变 Key 分布、顺序范围、文件/Controller 开销且通常不能减少。RabbitMQ 增 Consumer 受 Queue、prefetch 和单消息处理/下游容量限制。

优化顺序：定位慢步骤 → 批量/减少外部调用 → 调整并发到下游安全上限 → 必要时增加分区/队列。不要只增加 Consumer 把压力转给数据库。

## 5. 分区倾斜与热 Key

按 Partition 比较生产、lag 和处理 P99。热 Key 可能来自超级租户、单商品秒杀或错误 Key。解决可拆大租户、业务可交换时加子 Key、预聚合或专用通道；不能为均匀随机分区而破坏所需顺序。

## 6. Broker 容量

磁盘容量 = 写入 bytes/s × 保留时间 × 副本数 × 压缩/段/安全余量。还需网络复制、Page Cache、文件句柄、分区数、索引和重平衡临时空间。按 bytes 而非只按消息条数规划。

保留时间与消费者最大停机/重放窗口协调。消费者落后超过 retention 会永久缺数据，需快照重建方案。

## 7. 积压处置

1. 确认生产是否异常、消费是否停止、Broker 是否健康。
2. 按 Partition/错误类别定位瓶颈，保护下游。
3. 暂停非关键生产/消费，隔离 Poison Pill 和重试回流。
4. 临时扩容只到下游安全容量，分批追赶并观察最老年龄下降。
5. 若消息已过业务时效，按契约过期/补偿，不盲目全处理。
6. 复盘容量、告警提前量和重建路径。

## 8. 上线检查

- 容量是否包含峰值生产、重试回流、故障持续和恢复追赶余量？
- 是否同时监控 records/bytes lag、最老年龄和业务逾期？
- Consumer poll/prefetch/Worker/下游连接是否形成有界背压？
- 扩容是否受 Partition 和下游容量约束，而非只看实例数？
- 热 Key/分区倾斜是否有专用检测与不破坏顺序的方案？
- 积压超过 retention 或业务时效时是否有重建/过期策略？

下一篇：[调度、配置、发现与协调](/architecture/middleware/platform-capabilities)。
