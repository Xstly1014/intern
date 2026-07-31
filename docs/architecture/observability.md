# 可观测与运维层：从用户影响到证据、止损和改进

可观测性是根据系统输出推断内部状态的能力，运维则把这些证据变成发现、分级、止损、恢复和改进。目标不是“收集所有日志”，而是快速回答：**谁受影响、从何时开始、哪个变更相关、瓶颈在哪、如何安全止损、恢复是否完整。**

## 1. 运行时架构

![可观测信号从应用到分析平台的架构](/architecture/observability-signal-architecture.svg)

应用和平台产生 Metrics、Logs、Traces、Profiles、业务事件与变更事件；OpenTelemetry SDK/Agent 统一语义和上下文；Collector 接收、过滤、脱敏、批量、采样和路由；后端分别优化聚合、检索、链路和剖析；告警与事件平台将信号关联服务目录、SLO 和 Runbook。

遥测链路必须异步、有界、可降级。Collector/日志后端故障不能阻塞业务线程；丢弃、积压、采样和导出失败本身要被监控。

## 2. 信号分工

| 信号 | 最适合回答 | 不适合替代 |
|---|---|---|
| Metrics | 是否异常、规模、趋势、告警 | 单个请求完整细节 |
| Logs | 离散事件、错误上下文、搜索 | 高效全局聚合与因果路径 |
| Traces | 请求经过哪里、时间花在哪 | 永久业务审计 |
| Profiles | CPU、分配、锁具体在哪段代码 | 用户请求语义 |
| Events | 部署、配置、扩容、故障切换 | 连续性能分布 |
| Audit | 谁为何改变了什么 | 调试噪声和高频性能日志 |

这些信号以 service、version、environment、region、trace/correlation 和时间关联，不能各自成为信息孤岛。

## 3. 从用户旅程反推观测

![用户旅程、业务状态和技术依赖的观测关联](/architecture/observability-user-journey.svg)

例如“创建订单”不是 HTTP 200 就成功：入口受理、订单落库、库存预留、支付状态和最终完成分别有业务状态。技术 RED 与业务完成率、状态停留和补偿/对账差异共同定义体验。

为每个关键旅程明确：有效请求分母、成功条件、延迟边界、排除项、数据来源、owner 和 SLO。没有语义定义的仪表盘只是图表集合。

## 4. 观测边界

- 业务服务负责产生有语义的命令、状态和错误信号。
- 平台负责采集、传输、存储、查询、告警和成本治理。
- 服务 owner 负责 SLO、Dashboard、告警、Runbook 和值班响应。
- 安全/合规负责敏感字段、审计保留和访问策略。
- 管理层用错误预算平衡发布与可靠性，不以单点 CPU 代替用户目标。

## 5. Telemetry Schema

统一 resource 字段：service.name/version、deployment.environment、region/zone、instance、team。请求字段：route（模板而非原始 URL）、operation、result、error.type、trace/span/request ID。业务字段使用受控低基数枚举。

userId、orderId、完整 URL、SQL 参数和异常 message 不做指标标签；必要时进入受控日志/Trace。字段有 owner、类型、基数预算、数据分类和版本。

## 6. 本章专题

| 专题 | 深入内容 |
|---|---|
| [指标、SLI、SLO 与错误预算](/architecture/observability/metrics-slo) | RED/USE、直方图、Burn Rate 与业务 SLI |
| [结构化日志与审计](/architecture/observability/logging) | Schema、异常、脱敏、采样、保留与成本 |
| [Trace、上下文与剖析](/architecture/observability/tracing) | W3C、异步链、采样、Exemplar 与 Profile |
| [告警、降噪与 Runbook](/architecture/observability/alerting) | 症状告警、分级、抑制、合并和可执行性 |
| [事件响应与复盘](/architecture/observability/incident-response) | 指挥、止损、沟通、恢复验证和行动项 |
| [容量、健康与变更运维](/architecture/observability/operations) | 过载、健康探针、容量预测、发布与服务目录 |
| [Java 生产参考架构](/architecture/observability/reference) | Micrometer/OTel、Collector、测试和生产检查 |

## 7. 最小上线基线

- 关键用户旅程有可计算 SLI/SLO、owner 和错误预算策略。
- 每个服务有 RED、关键依赖、业务状态、容量和变更视图。
- 日志结构化、脱敏、有保留/采样预算；审计与调试分离。
- HTTP、线程池、Reactor、MQ 和任务上下文可关联且不串请求。
- Page 告警反映用户影响并附 Dashboard、Runbook 和 owner。
- 遥测管道故障不阻塞业务，丢弃/延迟/成本可见。
- 事件流程包含指挥、止损、沟通、恢复验证和无责复盘。

下一篇：[指标、SLI、SLO 与错误预算](/architecture/observability/metrics-slo)。
