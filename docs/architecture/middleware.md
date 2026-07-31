# 异步与中间件层：可靠传递、削峰与分布式协调

中间件提供跨业务复用的分布式能力：消息队列与事件流、任务调度、配置发布、服务发现、租约和少量一致性协调。它负责传递、保留、路由和触发，不拥有业务事实与补偿规则。**中间件提高系统协调能力，也引入新的容量、顺序、重复、积压、升级和灾难恢复责任。**

## 1. 能力版图与边界

![异步与中间件层的能力版图](/architecture/middleware-capability-map.svg)

| 能力 | 平台负责 | 业务仍负责 |
|---|---|---|
| 消息队列/事件流 | 持久化、路由、分区、投递、保留 | 事件含义、幂等、顺序 Key、补偿 |
| 任务调度 | 触发、分片、租约、执行记录 | 任务业务逻辑、可重入和修复语义 |
| 配置中心 | 版本、分发、灰度、审计 | 配置类型、合法性、默认值与回滚 |
| 服务发现 | 实例注册、健康、地址变化 | timeout、连接池、摘流和错误处理 |
| 分布式协调 | 选主、租约、小元数据一致性 | fencing、资源端校验和业务不变量 |
| RPC 韧性 | 限流、舱壁、熔断基础能力 | 幂等、降级是否符合业务语义 |

不要把 Kafka 当数据库写主、把 Redis 锁当事务、把配置中心当业务状态库，或把调度脚本当领域服务。

## 2. 一条事件的端到端路径

![事件从业务事务到消费者效果的端到端链路](/architecture/middleware-event-lifecycle.svg)

1. 业务服务在本地事务中保存状态与 Outbox 事件事实。
2. Relay/CDC 读取 Outbox，按分区 Key 发布并等待 Broker 确认。
3. Broker 持久化、复制并按 Topic/Exchange/Partition 路由。
4. Consumer 拉取/接收，验证 envelope、Schema、时间和大小。
5. 消费者在本地事务内插入 Inbox/去重并产生业务效果。
6. 提交成功后 ACK/提交 offset；ACK 丢失会重复投递，因此处理必须幂等。
7. 瞬时失败进入有界退避重试；永久错误隔离到 DLQ 并告警。
8. 对 lag、最老消息年龄、端到端延迟和业务处理结果做关联观测。

所谓 exactly-once 往往只覆盖 Broker 或流处理内部。跨数据库、Broker、消费者和外部副作用的端到端正确性仍要依赖幂等、状态机与对账。

## 3. 同步、事件与命令消息

- **同步调用**：当前决策必须立即获得结果，失败直接影响请求。
- **领域事件**：上下文内部刚发生的事实，可包含内部模型。
- **集成事件**：跨边界稳定公共事实，经过脱敏与版本治理。
- **命令消息**：要求特定所有者异步尝试动作，应只有一个逻辑处理者。
- **通知消息**：提醒/缓存失效等可丢失或合并的弱语义要明确。

`OrderPaid` 是事实；`SendSms` 是命令。把命令伪装成广播事件会造成所有权不清，把事实做成同步回调则增加耦合和级联。

## 4. 中间件选择不是功能清单对比

![消息中间件选型维度](/architecture/middleware-selection.svg)

选择依据包括路由模型、吞吐、端到端延迟、消息大小、保留/回放、顺序范围、消费者数量、延迟消息、事务集成、跨地域、运维团队和生态。峰值 TPS 只是一个维度。

RabbitMQ 擅长工作队列和灵活路由；Kafka 擅长高吞吐分区日志、保留与重复消费；RocketMQ 提供面向业务消息的延迟/事务等能力。具体版本和托管产品差异需要压测、故障演练和成本验证。

## 5. 消息 Envelope 基线

```json
{
  "eventId": "01J...",
  "type": "order.paid",
  "schemaVersion": 2,
  "occurredAt": "2026-07-31T10:00:00Z",
  "producer": "order-service",
  "tenantId": "t-42",
  "partitionKey": "order-123",
  "correlationId": "saga-456",
  "payload": {}
}
```

Envelope 字段稳定、大小有上限。Trace context 单独按标准传播；不在消息放 Token、Cookie、密码或完整 Entity。`occurredAt` 是业务发生时间，Broker append time 与消费时间分别观测。

## 6. 基础设计原则

- 至少一次是默认心智模型，任何处理点都可能重复。
- 顺序只在明确定义的 Key/Partition/Queue 范围内成立。
- 重试消耗容量并延迟后续消息，必须分类、退避、有上限。
- 消费能力要覆盖峰值生产和故障恢复追赶，而非只覆盖日常均值。
- 消息契约比代码存活更久，必须可发现、可兼容、可追踪消费者。
- Broker 不代替业务审计，DLQ 不代替问题处理。

## 7. 本章专题

| 专题 | 深入内容 |
|---|---|
| [消息模型、语义与选型](/architecture/middleware/messaging-model) | Queue/Log/PubSub、分区、顺序、保留和 Schema |
| [生产端可靠性与 Outbox](/architecture/middleware/producer-reliability) | Confirm、事务双写窗口、Relay、重复发布和事件版本 |
| [消费、幂等、顺序与重平衡](/architecture/middleware/consumer-processing) | ACK/offset、Inbox、乱序、Consumer Group 与 revoke |
| [重试、延迟与死信](/architecture/middleware/retry-dlq) | 错误分类、退避、毒消息、DLQ 修复和安全重放 |
| [流控、积压与容量](/architecture/middleware/backpressure-capacity) | lag、最老年龄、背压、分区倾斜和追赶预算 |
| [调度、配置、发现与协调](/architecture/middleware/platform-capabilities) | 可重入任务、配置灰度、服务发现、租约与 fencing |
| [Java 生产参考架构](/architecture/middleware/reference) | Spring Kafka/AMQP、观测、测试、发布和演练 |

## 8. 最小上线基线

- 生产发布与业务事务无静默丢失窗口，消费者端到端幂等。
- Partition Key、顺序范围、并行上限和热点风险已经定义。
- Schema 有版本、兼容门禁、消费者清单和敏感数据审查。
- 重试按错误分类，指数退避、有上限，DLQ 有负责人和重放工具。
- 容量覆盖峰值、Broker 故障和恢复追赶，积压按最老年龄告警。
- 调度任务可重入、可补跑、可暂停，不在脚本中复制业务规则。
- 配置、发现和协调故障有缓存/拒绝/fencing 策略并经过演练。

下一篇：[消息模型、语义与选型](/architecture/middleware/messaging-model)。
