# 告警设计、分级、降噪与 Runbook

告警的目的不是通知“指标变化”，而是在需要人工行动时把用户影响、证据和止损入口交给正确责任人。不可行动告警会消耗值班注意力并掩盖真正事故。

## 1. 告警管线

![从 SLO 症状到值班行动的告警管线](/architecture/observability-alert-pipeline.svg)

检测规则 → 持续窗口/防抖 → 分组去重 → 依赖抑制 → 路由 owner → Page/Ticket → ACK/升级。每步有延迟、失败和审计指标。

## 2. Page、Ticket 与信息

Page：正在发生且需立即行动的显著用户影响。Ticket：容量趋势、证书临期、慢性预算消耗等工作时间处理。告警包含 severity、影响、开始时间、service/region/version、SLO/Burn Rate、Dashboard、Runbook、最近变更和 owner。

## 3. 症状优先

用户错误率/延迟、队列最老年龄和业务完成率适合 Page；CPU/堆/磁盘用于原因诊断或提前 Ticket。资源饱和若即将导致不可逆故障，也可 Page，但必须有可执行阈值和提前量。

## 4. 降噪

![告警分组、抑制和依赖拓扑](/architecture/observability-alert-dedup.svg)

同事故按 service/region/cause 分组；父依赖故障抑制下游症状但仍显示影响清单；发布维护有定时 silence；flapping 用窗口/滞回。禁止无限静默，silence 有 owner、原因和到期。

## 5. Runbook

Runbook 包含影响确认、权限/前置、Dashboard 查询、常见原因、安全止损、验证、升级和回滚。命令参数使用占位和只读优先，不放永久 Secret。每次使用后根据实际缺口更新。

## 6. 告警质量

跟踪每条规则触发、ACK、有效事件、误报、无人处理、自动关闭和处理时间。高频低价值规则降级/删除；漏报从事故复盘补检测。目标不是“零告警”，而是高行动率和足够提前量。

## 7. 路由和升级

服务目录提供 owner、值班、依赖和严重度。跨团队事故由主症状指定 incident commander，不让多个团队各自抢修。未 ACK 按分钟升级，联系人/系统故障有备用路径。

## 8. 上线检查

- 每条 Page 是否对应当前用户影响和明确人工动作？
- 是否包含 owner、Dashboard、Runbook、最近变更和升级路径？
- 分组、抑制、滞回和 silence 是否减少风暴且不隐藏影响？
- 依赖告警是否能关联上游根因和下游范围？
- Runbook 是否经过演练、只读优先且不含 Secret？
- 是否持续治理误报、漏报、ACK 和行动率？

下一篇：[事件响应与复盘](/architecture/observability/incident-response)。
