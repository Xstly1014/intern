# Java 异步与中间件生产参考架构

参考架构以业务数据库 Outbox 为事件起点，Broker 提供持久分区传递，消费者通过 Inbox/状态机产生幂等效果；重试、DLQ、Schema、调度、配置与可观测形成完整控制面。

## 1. 生产参考拓扑

![Java 异步与中间件生产参考拓扑](/architecture/middleware-reference-topology.svg)

- Producer 的业务状态与 Outbox 同事务；Relay 等待 Broker Confirm。
- Broker 跨可用区复制，Topic/Queue 有 owner、配额、保留和 Schema。
- Consumer Group 按分区并行，业务 DB 用 Inbox/唯一约束去重。
- Retry/DLQ 与主通道隔离，有次数、年龄、容量、负责人和重放工具。
- Schema Registry/契约 CI 阻止破坏性事件发布。
- Scheduler/Config/Discovery/Coordination 是独立控制能力，不混存业务状态。

## 2. Spring Kafka / AMQP 基线

| 场景 | 基线 |
|---|---|
| Kafka Producer | `acks=all`、幂等 Producer、delivery timeout、有限重试、稳定 key |
| Kafka Consumer | 手动/受控 offset、合理 poll、revoke 排空、错误处理/DLT |
| Rabbit Producer | durable message/queue、Publisher Confirm、Return/无路由处理 |
| Rabbit Consumer | manual ACK、合理 prefetch、业务提交后 ACK、DLX/隔离 |
| 序列化 | 明确 Schema/version、大小上限、未知字段、禁止危险多态 |

配置值必须结合 Broker 版本、复制和业务目标验证，不能抄一套“最佳参数”。Listener 中不要开启数据库事务后阻塞长远程调用。

## 3. 线程与背压

消费并发由 Partition/Queue、单消息处理时间和下游容量共同决定。Listener 到 Worker Pool 的内部队列有界；队列满时暂停拉取/降低 prefetch。虚拟线程不增加数据库连接和下游配额。

批量消费可摊薄开销，但需要定义部分失败、批次事务、offset 连续性和单条毒消息隔离。不要因为一条失败无限回滚整个大批次。

## 4. 可观测模型

![消息从生产到业务效果的可观测链](/architecture/middleware-observability.svg)

生产：业务 commit→outbox age→relay attempt→broker ACK。Broker：produce/fetch bytes、磁盘、复制、ISR/Quorum、分区倾斜。消费：lag/oldest age、poll→start→business commit→ACK、重试/DLQ、业务结果。

长异步链通过 eventId、correlationId、causationId 和 aggregateVersion 关联；Trace 可链接 producer/consumer span，但业务事实不能只靠短期 Trace 保存。

指标标签使用 topic、group、event type、result、version 等低基数；eventId/orderId 放日志/Trace。

## 5. 测试矩阵

| 层次 | 必测内容 |
|---|---|
| 单元 | 路由 Key、错误分类、退避、幂等、版本比较 |
| 契约 | Schema 兼容、未知字段/枚举、数据分类和消费者契约 |
| 集成 | 真实 Broker、Confirm、ACK、事务、分区和权限 |
| 崩溃注入 | DB commit 前后、发布前后、消费 commit/ACK 前后 |
| 乱序重复 | 同事件重复、版本逆序、缺口、DLQ 重放 |
| 容量 | 峰值 bytes/s、热点 Partition、积压与恢复追赶 |
| 灾难 | Broker 节点/AZ、磁盘、网络分区、重平衡、控制面故障 |

Testcontainers 适合集成语义，但多节点复制、磁盘和网络故障需在接近生产的环境演练。

## 6. 发布与兼容

事件变更先发布兼容消费者，再发布生产者，最后清理旧字段。新 Topic/Partition/Queue 配置先做容量和权限评审。Consumer 发布时 readiness 停止、触发 revoke/排空、提交连续 offset，再终止。

Broker 升级验证客户端协议、Controller/元数据、复制、滚动顺序和回滚限制；升级期间保留容量，避免 Rebalance 与副本迁移同时放大。

## 7. 故障演练

- Outbox Relay 全停后恢复，事件不丢且按预算追赶。
- Confirm/ACK 丢失制造重复，业务效果仍只有一次。
- Poison Pill 隔离，不阻塞全部 Partition；修复后限速重放。
- 下游数据库变慢，Consumer 背压而不耗尽连接/OOM。
- Broker 磁盘/副本异常时 Producer 失败语义明确，不假成功。
- Consumer Group 频繁 Rebalance 时在途任务和 offset 正确。
- 配置中心、发现、调度和协调失联时执行 last-known-good/fencing。

## 8. 完整评审清单

### 消息语义

- Queue/PubSub/Log、命令/事实、顺序范围和保留是否明确？
- Producer→Broker→Consumer→业务效果各崩溃窗口是否覆盖？
- Schema、Payload、敏感数据、消费者和废弃是否治理？

### 失败与容量

- 重试/DLQ 是否分类、退避、限次、限龄、可诊断和安全重放？
- 容量是否覆盖 bytes、分区、复制、峰值、故障和追赶余量？
- 背压是否到达入口，而非隐藏在无界线程池/队列？

### 平台能力

- 任务是否幂等可重入，配置是否原子灰度，发现是否可摘流？
- 租约是否由资源端 fencing，协调系统是否只存小元数据？
- 所有管理面是否最小权限、审计、备份、升级和故障演练？

下一层是[外部集成层](/architecture/integration)：中间件可靠传递内部事实，外部集成层负责供应商协议、回调、配额、合规与隔离。
