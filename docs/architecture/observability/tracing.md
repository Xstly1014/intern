# 分布式 Trace、上下文传播、采样与连续剖析

Trace 还原一次请求/事件的因果路径和耗时分解。它依赖每一跳正确传播上下文，并需要在采样成本和保留高价值链路之间权衡。

## 1. Span 模型

![同步与异步调用的 Trace 关系](/architecture/observability-trace-topology.svg)

入口创建 server span，下游每次尝试创建 client span；数据库/缓存用 semantic conventions；MQ Producer 与 Consumer 通过 trace/link 关联，消费处理创建新 span。重试每次独立 span，不能合并掩盖尝试次数。

## 2. 上下文传播

HTTP/gRPC 使用 W3C `traceparent`/`baggage`；外部输入校验格式和长度，不信任采样/任意 baggage。消息 Envelope 传播标准 context，但长期业务 correlation 另用 correlation/causation ID。

ThreadLocal 不自动跨 `CompletableFuture`、线程池、Reactor scheduler；使用 OTel/Spring context bridge 并测试。Baggage 最小化，不放用户/敏感数据。

## 3. Span 属性与事件

属性用低基数 route、operation、result、peer/service、messaging destination；orderId 等放日志/受控 span attribute 并评估成本。异常 recordException + status，避免每层重复。

## 4. 采样

![头部采样与尾部采样决策](/architecture/observability-trace-sampling.svg)

Head sampling 入口快速决定，成本低但可能漏罕见错误；Tail sampling 在 Collector 看完整 Trace 后保留错误、慢、高价值交易，需缓冲内存和等待。采用父采样一致性，重要业务可低比例基线 + 错误尾采样。

采样率作为字段保留，不能用采样 Trace 直接计算无权重业务总量。

## 5. Exemplar 与信号关联

Histogram Exemplar 从异常 Bucket 跳到代表 Trace；Trace 通过 trace ID 查结构日志；部署版本和 Profile 链接同时间/实例。这样从 SLO 告警逐级下钻，而非在多个平台手工猜时间。

## 6. 连续剖析

CPU、allocation、lock、wall-clock Profile 按 service/version/instance 低开销采样。与 Trace/span 关联可回答“哪些请求导致 CPU/分配”。生产采用成熟 profiler，控制频率、保留和代码符号访问。

## 7. Trace 局限

Trace 采样且有保留期，不能证明所有业务动作；异步长流程跨数天时以持久 Saga/事件状态为事实。Trace 快不代表投影新鲜或业务最终成功。

## 8. 上线检查

- HTTP、RPC、MQ、线程池、Reactor 和任务上下文是否正确传播？
- 每次下游尝试是否独立 span，重试/排队/连接可见？
- 属性/baggage 是否低基数、最小化且不含敏感数据？
- Head/Tail 采样是否有成本、缓冲和缺失说明？
- Metrics→Exemplar→Trace→Logs→Profile 是否可下钻？
- 长业务流程是否有独立持久 correlation/状态事实？

下一篇：[告警、降噪与 Runbook](/architecture/observability/alerting)。
