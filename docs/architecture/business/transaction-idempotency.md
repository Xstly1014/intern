# 本地事务、幂等、可靠事件与 Outbox

本地数据库事务是业务服务最可靠的一致性工具。设计目标是让业务状态、幂等结果和待发布事实在一次短提交中共同落地，远程交互在提交之外以可恢复方式推进。

## 1. 本地事务边界

事务通常由应用用例开启，覆盖加载聚合、授权、领域行为、保存、幂等记录、Outbox 和业务审计事实。不要在 Controller 开放超大事务，也不要把事务注解散在私有方法并误以为代理会生效。

![本地事务与事务外工作边界](/architecture/business-local-transaction.svg)

事务内不等待 HTTP、MQ Broker 确认、邮件、对象存储或大计算。否则数据库连接和锁持续占用，远端超时把局部故障扩散到数据库。

## 2. 隔离与并发异常

根据业务风险处理丢失更新、不可重复读、幻读和写偏差。提高隔离级别不是唯一方案；唯一约束、条件更新、版本号和显式锁通常更局部可控。必须在真实数据库上做并发测试，H2 等替代品不能证明生产隔离语义。

事务回滚范围和异常规则要清晰。捕获异常后继续提交可能保存半成品；过宽 `rollbackFor` 又可能把可预期业务拒绝变成异常控制流。

## 3. API 幂等

![幂等键从首次执行到重复返回](/architecture/business-idempotency-flow.svg)

幂等 Key 的作用域至少包括 tenant/subject、操作和 key。首次请求原子占位并保存请求指纹；相同 key + 相同语义返回原结果，相同 key + 不同载荷返回冲突。记录状态可为 processing/succeeded/failed-retryable，并处理执行者崩溃后的租约接管。

不要只用 Redis `SETNX` 后执行数据库写：缓存丢失、TTL 到期或写库失败会产生歧义。核心业务幂等事实优先与业务数据同库事务保存。

## 4. 业务天然幂等与技术去重

“将订单标记已取消”在已取消时可返回原结果；“余额增加 100”天然不幂等，必须用唯一交易 ID/账本记录。技术去重不能替代领域定义重复动作应返回什么。

幂等记录要有保留期，至少覆盖客户端最大重试、消息重放和业务争议窗口。删除后重复到达会重新执行，需明确是否可接受。

## 5. Transactional Outbox

![Transactional Outbox 可靠发布链路](/architecture/business-outbox-flow.svg)

业务表和 Outbox 行在同一事务提交；独立 Relay 轮询/CDC 读取未发布记录发送 Broker，成功后标记或依赖日志位置推进。Relay 崩溃可能重复发送，所以 Outbox 保证“不会静默丢失”，不是端到端 exactly-once。

Outbox 包含 event ID、aggregate ID/version、type、schema version、occurredAt、tenant、trace/correlation 和 payload。控制 Payload 大小与敏感数据，不把整张 Entity 序列化出去。

## 6. Inbox 与消费者幂等

消费者按 event ID 或业务唯一键在同一数据库事务插入 Inbox/处理记录并更新业务状态。先 ACK 后提交会丢，先提交后 ACK 可能重复；因此处理必须可重复。去重记录与业务效果若不原子，仍有崩溃窗口。

乱序处理使用 aggregate version、状态机和缓冲/重查策略。不能假设“Kafka 有顺序”就全局有序，顺序只在同一 Partition 且 Key 正确时成立。

## 7. 事件发布运维

监控未发布 Outbox 数量、最老年龄、发送失败、重试、单事件毒化和 Relay lease。死信不是终点：要能查看、修复、重放，并在重放前评估消费者幂等与 Schema 兼容。

清理 Outbox/Inbox 按审计、重放和争议窗口设计，分批删除避免表膨胀和锁冲击。

## 8. 上线检查

- 本地事务是否短小，远程 I/O 和大计算都在事务外？
- 幂等作用域、请求指纹、并发首次请求和崩溃接管是否定义？
- 业务状态、幂等结果、Outbox 与必要审计是否原子提交？
- Relay 重复发送时所有消费者是否仍正确？
- 消费者 Inbox 与业务效果是否在同一事务？
- Outbox/Inbox 积压、毒消息、清理和人工重放是否可运维？

下一篇：[Saga、TCC 与对账修复](/architecture/business/distributed-workflow)。
