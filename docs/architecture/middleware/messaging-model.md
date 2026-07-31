# 消息模型、投递语义、分区与契约

消息系统的基础选择是：数据是一次性分工处理，还是可保留、可回放的事件日志；需要竞争消费还是多订阅方各自维护进度；顺序要覆盖哪个业务 Key。

## 1. Queue、Pub/Sub 与 Log

![工作队列、发布订阅和分区日志模型](/architecture/middleware-message-models.svg)

| 模型 | 消费进度 | 适用 |
|---|---|---|
| 工作队列 | 一条消息由一个 Worker 完成 | 异步任务、削峰 |
| Pub/Sub | 每个订阅收到一份 | 通知多个独立能力 |
| 分区日志 | Consumer Group 维护 offset，可回放 | 事件流、投影、审计型集成 |

RabbitMQ Exchange + Queue 可表达 Direct/Topic/Fanout；Kafka Topic/Partition 是追加日志。不能仅凭产品名推断语义，要落实到队列、订阅、保留与 ACK 配置。

## 2. 投递语义

- **At-most-once**：先 ACK/提交进度再处理，可能丢、不重复，适合可丢通知。
- **At-least-once**：处理成功后 ACK，崩溃窗口会重复，是业务默认选择。
- **Exactly-once**：通常限定在同一 Broker/事务处理拓扑；外部数据库、HTTP 和邮件仍需幂等。

业务契约应写“重复时结果如何”，而不是只标一个 exactly-once 标签。

## 3. 分区与顺序

![Partition Key 决定局部顺序和并行度](/architecture/middleware-partition-order.svg)

同一 orderId 映射同一 Partition，可保持该订单内日志顺序；不同订单并行。顺序只包括 Broker 接受的记录顺序，不代表业务发生时间、网络回调顺序或消费者事务提交顺序。

Key 选择需要平衡：业务聚合顺序、分区均匀、消费者并行和未来扩容。tenantId 可能让大租户成为热点；随机 Key 会破坏聚合顺序。监控每分区 bytes、records、lag 和处理耗时。

## 4. 消息大小与 Payload

消息承载消费者完成反应所需的稳定事实，不发送大文件、无限数组和完整数据库行。大对象存对象存储，消息携带受控引用和校验和。设置生产、Broker、消费者一致的最大值，避免某端接受另一端拒绝。

只传 ID 会让所有消费者同步回调生产者，形成反向耦合；传过多字段会泄露数据并增加演进成本。按事件用途权衡。

## 5. Schema 演进

新增可选字段通常兼容；删除、重命名、改变类型/单位/null/枚举语义通常破坏。消费者忽略未知字段并定义未知枚举 fallback。Schema Registry/CI 检查结构兼容，语义变更仍需人工评审和消费者契约测试。

Topic 版本不是每次字段变化都新建。需要完全不同语义/数据保留/权限时才新 Topic，并设计双发/迁移/停旧窗口。

## 6. 事件时间与版本

区分 occurredAt、publishedAt、broker timestamp、processedAt。迟到事件按业务版本而不是到达时间覆盖状态。聚合事件携带 aggregateVersion；投影只接受更高版本，发现缺口时回源/补数。

## 7. Topic/Queue 所有权

每个 Topic/事件类型有业务 owner、Schema owner、数据分类、分区/副本、保留、生产者、消费者、SLO 和废弃日期。禁止所有团队向一个 `common-events` 任意写 JSON。

消费组命名体现应用和用途，不能多个不相关应用误用同一 Group 导致分摊而非广播。

## 8. 上线检查

- 消息是任务、命令还是事实？是竞争消费还是每订阅方一份？
- 至少一次重复的业务结果是否明确并经过测试？
- 分区 Key 是否匹配顺序边界，热点和并行上限是否测量？
- Payload 是否有大小、数据分类、保留和删除策略？
- Schema 是否同时做结构兼容和语义/消费者评审？
- Topic/Queue、事件和 Consumer Group 是否都有清晰所有者？

下一篇：[生产端可靠性与 Outbox](/architecture/middleware/producer-reliability)。
