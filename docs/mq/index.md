# 消息队列面试高频 100 题

消息队列（Message Queue）是分布式系统中极为重要的中间件，核心作用是 **解耦、异步、削峰**。

本系列涵盖 8 大模块、100 道高频面试题，从基础概念到架构原理，从性能优化到实战场景，图解 RabbitMQ 与 Kafka 核心知识。

## 目录总览

### 第一章 消息队列基础 (Q1-Q12)

- [Q1 消息队列本质](/mq/basics/q01) · [Q2 三大核心作用](/mq/basics/q02) · [Q3 同步 vs 异步](/mq/basics/q03)
- [Q4 点对点 vs 发布订阅](/mq/basics/q04) · [Q5 推模式 vs 拉模式](/mq/basics/q05) · [Q6 消息队列对比选型](/mq/basics/q06)
- [Q7 引入 MQ 的代价](/mq/basics/q07) · [Q8 消息模型术语](/mq/basics/q08) · [Q9 消息投递语义](/mq/basics/q09)
- [Q10 JMS vs AMQP](/mq/basics/q10) · [Q11 消息幂等性](/mq/basics/q11) · [Q12 消息积压本质](/mq/basics/q12)

### 第二章 RabbitMQ 核心架构 (Q13-Q28)

- [Q13 RabbitMQ 核心组件](/mq/rabbitmq-core/q13) · [Q14 Exchange 四种类型](/mq/rabbitmq-core/q14) · [Q15 Direct Exchange 路由](/mq/rabbitmq-core/q15)
- [Q16 Topic Exchange 通配](/mq/rabbitmq-core/q16) · [Q17 Fanout Exchange 广播](/mq/rabbitmq-core/q17) · [Q18 Headers Exchange](/mq/rabbitmq-core/q18)
- [Q19 Queue 属性详解](/mq/rabbitmq-core/q19) · [Q20 Binding 与 Routing Key](/mq/rabbitmq-core/q20) · [Q21 Connection vs Channel](/mq/rabbitmq-core/q21)
- [Q22 Virtual Host 作用](/mq/rabbitmq-core/q22) · [Q23 死信队列 DLX](/mq/rabbitmq-core/q23) · [Q24 延迟队列实现](/mq/rabbitmq-core/q24)
- [Q25 优先级队列](/mq/rabbitmq-core/q25) · [Q26 TTL 消息过期](/mq/rabbitmq-core/q26) · [Q27 持久化机制](/mq/rabbitmq-core/q27)
- [Q28 镜像队列](/mq/rabbitmq-core/q28)

### 第三章 RabbitMQ 高级特性 (Q29-Q40)

- [Q29 生产者确认机制](/mq/rabbitmq-advanced/q29) · [Q30 消费者 ACK 机制](/mq/rabbitmq-advanced/q30) · [Q31 prefetch 控制流控](/mq/rabbitmq-advanced/q31)
- [Q32 消息拒绝与 requeue](/mq/rabbitmq-advanced/q32) · [Q33 QoS prefetch 调优](/mq/rabbitmq-advanced/q33) · [Q34 RabbitMQ 集群架构](/mq/rabbitmq-advanced/q34)
- [Q35 节点类型 disk/ram](/mq/rabbitmq-advanced/q35) · [Q36 Quorum Queue 仲裁队列](/mq/rabbitmq-advanced/q36) · [Q37 Federation 联邦](/mq/rabbitmq-advanced/q37)
- [Q38 Shovel 数据迁移](/mq/rabbitmq-advanced/q38) · [Q39 消息追踪](/mq/rabbitmq-advanced/q39) · [Q40 RabbitMQ 插件体系](/mq/rabbitmq-advanced/q40)

### 第四章 Kafka 核心架构 (Q41-Q58)

- [Q41 Kafka 核心概念](/mq/kafka-core/q41) · [Q42 Topic 与 Partition](/mq/kafka-core/q42) · [Q43 Partition 分区作用](/mq/kafka-core/q43)
- [Q44 Leader 与 Follower](/mq/kafka-core/q44) · [Q45 ISR 机制](/mq/kafka-core/q45) · [Q46 Controller 控制器](/mq/kafka-core/q46)
- [Q47 Consumer Group](/mq/kafka-core/q47) · [Q48 Rebalance 重平衡](/mq/kafka-core/q48) · [Q49 Offset 管理](/mq/kafka-core/q49)
- [Q50 __consumer_offsets](/mq/kafka-core/q50) · [Q51 Producer 工作流程](/mq/kafka-core/q51) · [Q52 Consumer 拉取流程](/mq/kafka-core/q52)
- [Q53 ZooKeeper 作用](/mq/kafka-core/q53) · [Q54 KRaft 模式](/mq/kafka-core/q54) · [Q55 消息格式演进](/mq/kafka-core/q55)
- [Q56 Log Segment 分段](/mq/kafka-core/q56) · [Q57 副本同步机制](/mq/kafka-core/q57) · [Q58 HW 与 LEO](/mq/kafka-core/q58)

### 第五章 Kafka 高性能原理 (Q59-Q70)

- [Q59 顺序写盘](/mq/kafka-performance/q59) · [Q60 Page Cache](/mq/kafka-performance/q60) · [Q61 零拷贝 sendfile](/mq/kafka-performance/q61)
- [Q62 批量发送](/mq/kafka-performance/q62) · [Q63 消息压缩](/mq/kafka-performance/q63) · [Q64 分区并行](/mq/kafka-performance/q64)
- [Q65 索引文件](/mq/kafka-performance/q65) · [Q66 Time Index](/mq/kafka-performance/q66) · [Q67 消费者组并行度](/mq/kafka-performance/q67)
- [Q68 粘性分区器](/mq/kafka-performance/q68) · [Q69 Broker 网络模型](/mq/kafka-performance/q69) · [Q70 Kafka vs 传统 MQ](/mq/kafka-performance/q70)

### 第六章 可靠性与一致性 (Q71-Q82)

- [Q71 生产者不丢消息](/mq/reliability/q71) · [Q72 acks 参数详解](/mq/reliability/q72) · [Q73 Broker 不丢消息](/mq/reliability/q73)
- [Q74 min.insync.replicas](/mq/reliability/q74) · [Q75 unclean.leader.election](/mq/reliability/q75) · [Q76 消费者不丢消息](/mq/reliability/q76)
- [Q77 Exactly-Once 语义](/mq/reliability/q77) · [Q78 幂等生产者](/mq/reliability/q78) · [Q79 事务消息](/mq/reliability/q79)
- [Q80 消息重复根因](/mq/reliability/q80) · [Q81 消息顺序性保证](/mq/reliability/q81) · [Q82 分布式事务消息](/mq/reliability/q82)

### 第七章 运维与调优 (Q83-Q92)

- [Q83 分区数选择](/mq/ops-tuning/q83) · [Q84 副本数选择](/mq/ops-tuning/q84) · [Q85 消息积压排查](/mq/ops-tuning/q85)
- [Q86 Rebalance 优化](/mq/ops-tuning/q86) · [Q87 磁盘容量规划](/mq/ops-tuning/q87) · [Q88 监控指标体系](/mq/ops-tuning/q88)
- [Q89 RabbitMQ 内存管理](/mq/ops-tuning/q89) · [Q90 Kafka 参数调优](/mq/ops-tuning/q90) · [Q91 集群扩容](/mq/ops-tuning/q91)
- [Q92 版本升级方案](/mq/ops-tuning/q92)

### 第八章 场景与实战 (Q93-Q100)

- [Q93 订单异步处理](/mq/scenarios/q93) · [Q94 秒杀削峰](/mq/scenarios/q94) · [Q95 日志收集架构](/mq/scenarios/q95)
- [Q96 消息广播通知](/mq/scenarios/q96) · [Q97 延迟任务设计](/mq/scenarios/q97) · [Q98 Agent 事件驱动](/mq/scenarios/q98)
- [Q99 跨机房消息同步](/mq/scenarios/q99) · [Q100 系统设计综合题](/mq/scenarios/q100)
