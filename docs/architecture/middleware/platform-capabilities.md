# 任务调度、配置发布、服务发现与分布式协调

这些能力都涉及“多个实例如何看到同一控制状态”，但一致性与失败语义不同。调度触发业务工作，配置分发意图，服务发现传播地址，协调系统管理短租约和少量元数据；都不应保存高频业务事实。

## 1. 可靠任务调度

![调度触发、分片执行与补跑状态](/architecture/middleware-scheduler-flow.svg)

调度器保存 job definition、计划时间、execution ID、参数、分片和触发记录；Worker 领取租约，调用业务用例，心跳/续租，提交结果。触发可能重复，Worker 崩溃可重分配，所以任务必须以业务周期/分片 Key 幂等。

调度器负责何时和哪一分片，业务服务负责做什么。XXL-JOB/Quartz 脚本中不复制价格、退款或数据修复规则。

## 2. 大任务设计

按稳定游标/范围分片，每批短事务，保存 checkpoint；可暂停、限速、取消、补跑和 dry-run。控制每 Worker 的数据库/下游并发，避免凌晨任务集体打满主库。补跑使用原 execution/business key，不能重复产生效果。

任务状态区分 triggered/running/succeeded/failed/expired/cancelled/needs-attention。超时后旧 Worker 可能继续执行，资源写入使用 fencing/version 拒绝过期执行者。

## 3. 动态配置发布

![配置从变更到灰度生效和回滚](/architecture/middleware-config-rollout.svg)

配置有类型、Schema、默认值、作用域、owner、敏感级别和版本。流程：编辑 → 校验 → 审批 → 小范围灰度 → 观测 → 扩大 → 完成/回滚。客户端原子应用完整版本；非法/不完整配置拒绝并保留 last-known-good。

Feature Flag 包含 owner、实验/规则、默认、开始/到期和清理任务。Flag 不能绕过安全授权；长期 Flag 会形成不可测试的分支组合。

Secret 不放普通配置中心或明文推送，使用 Secret Manager/KMS 短期注入和轮换。

## 4. 服务发现

Kubernetes 内优先 Service/DNS/EndpointSlice；客户端缓存地址但尊重 TTL/连接寿命，实例 readiness 失败后摘流并排空已有连接。发现提供地址，不保证调用成功；每次 RPC 仍需 deadline、舱壁和重试预算。

控制面短暂故障可使用 last-known-good 实例集，过久则地址陈旧。新实例注册成功不等于已就绪，健康检查必须反映能否服务。

## 5. 租约、选主与 fencing

![租约过期与 Fencing Token 拒绝旧持有者](/architecture/middleware-fencing-token.svg)

Client A 获得 token 41 后暂停，租约过期；Client B 获得 42 并写资源；A 恢复后即使认为仍持锁，资源端也拒绝 token 41。没有资源端 fencing，Redis/ZooKeeper 锁无法阻止暂停进程迟到写入。

优先数据库唯一约束/CAS、消息按 Key 串行和幂等。协调系统只保存少量租约/拓扑元数据，不承载业务大对象和高频计数。

## 6. 配置/协调故障语义

- 配置中心不可用：运行现有有效配置，启动是否允许取决于关键性和缓存可信度。
- 收到非法版本：拒绝整个版本，不部分应用；告警并保留旧值。
- 服务发现抖动：合并变化、连接排空，避免全量重连风暴。
- 协调会话断开：停止受租约保护的工作，资源端仍验证 fencing。
- 时钟偏差：租约使用服务端/单调时间语义，不用业务节点墙钟猜测所有权。

## 7. 审计与权限

配置、Job、重放、选主和注册中心管理操作使用独立管理身份、RBAC、MFA 和审计。生产变更支持审批与 Break-glass；应用只读自身 namespace，不能列出所有环境 Secret/服务。

## 8. 上线检查

- 任务是否按业务周期/分片幂等，可暂停、补跑、限速和恢复？
- 调度租约过期后旧 Worker 是否会被 fencing/version 拒绝？
- 配置是否有 Schema、原子版本、灰度、last-known-good 和回滚？
- Feature Flag 是否有 owner、到期和安全边界？
- 服务发现故障/摘流是否处理缓存、连接寿命和重连风暴？
- 管理操作是否最小权限、审批、MFA 和完整审计？

下一篇：[Java 生产参考架构](/architecture/middleware/reference)。
