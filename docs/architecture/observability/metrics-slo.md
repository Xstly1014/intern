# 指标、SLI、SLO、错误预算与 Burn Rate

指标适合低成本聚合趋势和告警。好的指标从用户目标和系统约束出发，而不是把所有 Java 字段暴露成标签。

## 1. RED、USE 与业务指标

![RED、USE 与业务 SLI 的三层指标模型](/architecture/observability-metric-model.svg)

- RED：请求 Rate、Errors、Duration，按 route/operation/result 聚合。
- USE：资源 Utilization、Saturation、Errors，例如线程池、连接池、CPU、磁盘。
- 业务：下单完成率、支付未知状态、订单停留、补偿和对账差异。

RED 用于发现用户症状，USE 用于解释资源原因，业务指标验证技术响应是否真正创造结果。

## 2. 指标类型

Counter 只增，用 rate/increase；Gauge 表示当前值但可能抖动/丢实例；Histogram 记录分布并可跨实例聚合分位数；Summary 客户端分位数通常不能正确聚合。延迟优先 Histogram，Bucket 围绕 SLO 阈值设计。

平均值会掩盖长尾。P99 适合诊断，SLO 更常直接计算阈值内 good/total。

## 3. SLI 定义

![SLI 从事件到 Good Total 比例](/architecture/observability-sli-calculation.svg)

SLI 明确分子、分母、窗口、延迟阈值、有效请求、排除项和数据缺失语义。例如：30 天内有效创建订单中，800 ms 内被接受且 5 分钟内最终落单的比例。

不要排除所有 4xx；供应商/服务端错误分类要稳定。遥测缺失不能默认算成功。

## 4. SLO 与错误预算

99.9%/30 天意味着 0.1% 可失败预算。预算是可靠性与发布速度的治理工具，不是允许故意失败。定义预算消耗过快时的动作：冻结高风险发布、降低变更并发、优先可靠性和复盘。

SLO 应比合同 SLA 更严格并留运营余量。过高无业务价值的 SLO 会显著增加成本。

## 5. Multi-window Burn Rate

![多窗口 Burn Rate 告警](/architecture/observability-burn-rate.svg)

Burn Rate = 当前错误比例 / 允许错误比例。快速窗口 + 慢速窗口同时超阈值捕获真实持续问题；一组高阈值发现快速烧毁，一组低阈值发现慢性退化。比固定“错误率 > 1%”适应不同 SLO。

## 6. 基数与成本

标签组合数相乘。禁止 userId、orderId、原始 URL、异常文本；route 用模板，错误用稳定类别，version 设保留策略。上线前估算 time series = 指标 × 标签组合 × 实例/region。

## 7. 记录规则与 Dashboard

常用聚合用 recording rules 预计算，规则版本化测试。Dashboard 从用户 SLO/业务状态开始，再下钻依赖和资源，不以 JVM 图开场。部署/配置事件叠加时间线。

## 8. 上线检查

- SLI 是否定义 good/total、阈值、窗口、排除与缺失语义？
- Histogram Bucket 是否围绕 SLO，避免只看平均？
- Page 是否使用 Burn Rate 与用户影响，而非单点资源阈值？
- 标签是否有基数预算和数据分类？
- 错误预算耗尽是否对应明确发布/可靠性动作？

下一篇：[结构化日志与审计](/architecture/observability/logging)。
