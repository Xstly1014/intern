# Java 可观测与运维生产参考架构

参考架构以 OpenTelemetry 语义统一 Java 应用、基础设施和异步链路，Collector 分层处理与路由，Metrics/Logs/Traces/Profiles 后端通过 SLO、Exemplar 和服务目录关联，事件平台负责告警和值班闭环。

## 1. 生产参考拓扑

![Java 可观测与运维生产参考拓扑](/architecture/observability-reference-topology.svg)

- Java 应用通过 Micrometer/OTel 产生标准指标、Span 和结构日志。
- Node/Cluster/DB/Broker Exporter 补充平台资源与依赖信号。
- Agent/Gateway Collector 有界接收、脱敏、采样、批量和多后端路由。
- Prometheus/日志/Trace/Profile 后端独立扩展与保留。
- SLO/Alert Manager 关联服务目录、变更事件、Runbook 和 On-call。

## 2. Java 埋点基线

Spring Boot Actuator + Micrometer 提供 JVM、HTTP、连接池等基础指标；OpenTelemetry Java Agent 自动采集常用框架，业务用例补稳定业务指标/Span。自动埋点先审查 route、SQL、Header 和敏感属性。

统一 Observation/Span 命名，不同时重复接入多个 Agent 造成双倍信号。自定义 Counter/Timer 注册复用，不能按请求动态创建标签组合。

## 3. 上下文与异步

Servlet/WebFlux、RestClient/WebClient、Kafka/Rabbit、Executor/CompletableFuture 和 Scheduler 分别做传播测试。消息消费建立 consumer span/link，correlation ID 贯穿长流程。MDC 由当前 context 填充并在结束时清理，防线程复用串请求。

## 4. Collector 设计

![OpenTelemetry Collector 分层处理管线](/architecture/observability-collector-pipeline.svg)

Agent Collector 减少应用直连；Gateway 做 tail sampling、属性治理和多租户路由。配置包含 memory limiter、batch、queue/retry、敏感字段 filter 和 exporter timeout。队列必须有界，失败丢弃有指标。

Collector 自身多 AZ、滚动升级和容量压测；Tail sampling 按 trace/s 与等待窗口估算内存。

## 5. Telemetry 可靠性与成本

遥测不是核心交易同步依赖。应用 export timeout 短、异步缓冲；平台故障优先保留 SLO/错误/审计，丢低价值 debug。按团队分配 series、ingest bytes、trace spans 和查询预算，超限告警而非直接拖垮共享平台。

## 6. 验证与测试

- 单元测试指标名、标签和值，防动态高基数。
- 组件测试 Trace propagation、日志 trace ID 和敏感字段过滤。
- 负载测试 SDK/Agent/Collector CPU、内存、网络与丢弃。
- 故障测试后端断开、Collector 满队列、Tail sampler 过载。
- Synthetic/演练验证 SLO→告警→Page→Runbook→止损完整链路。
- 发布前检查 Dashboard/告警与新 route/error/schema 同步。

## 7. 生产检查清单

### 目标与信号

- 关键旅程是否有业务正确的 SLI/SLO，而非 HTTP 代理指标？
- RED、USE、业务状态、依赖和变更是否可关联下钻？
- Schema、基数、敏感字段、采样、保留和成本是否治理？

### 告警与响应

- Page 是否基于用户影响/Burn Rate，附 owner、Runbook 和最近变更？
- 事件角色、止损、沟通、恢复验证和复盘是否演练？
- 告警质量与行动项是否持续治理？

### 平台与运维

- 遥测管道故障是否不阻塞业务，丢弃和延迟是否可见？
- 容量、健康、过载、发布、服务目录和 Toil 是否纳入日常运维？
- Collector/后端是否有 HA、升级、备份、权限和灾难恢复？

下一层是[基础设施与交付层](/architecture/infrastructure)：运维层提供反馈与事件闭环，基础设施层负责运行环境、网络、计算、交付和供应链控制。
