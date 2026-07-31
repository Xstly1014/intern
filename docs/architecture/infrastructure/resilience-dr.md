# 高可用、弹性、故障域与灾难恢复

高可用处理实例、节点和可用区日常故障；灾备处理地域、账户或大范围控制面灾难。多部署一套系统不等于可切换，数据、身份、流量和操作流程必须共同验证。

## 1. 故障域

![实例节点可用区地域的故障域](/architecture/infrastructure-failure-domains.svg)

副本跨 Node/AZ，依赖也要冗余；共享数据库/出口/证书/控制面可能仍是共同故障点。绘制服务依赖与 blast radius，验证单 AZ 损失后剩余容量。

## 2. 弹性

HPA 指标匹配瓶颈：请求并发、队列 lag、CPU 等；设置稳定窗口和扩/缩速率。扩容有镜像拉取、JVM 启动、连接建立和缓存预热延迟。Cluster Autoscaler 更慢，需 headroom/预留节点。

缩容先摘流/Consumer revoke/释放 lease；不能按 CPU 低直接杀有在途长任务的 Pod。

## 3. RTO/RPO 与策略

![业务影响到 DR 策略选择](/architecture/infrastructure-dr-strategy.svg)

按业务影响定义 RTO/RPO，选择 backup-restore、pilot light、warm standby、active-passive 或 multi-region active。越靠多活，成本和数据冲突/路由复杂度越高。不是所有能力都同等级。

## 4. 数据与全局状态

异步跨区复制可能丢最近提交；同步增加延迟和耦合。会话、幂等、队列、对象、Secret、DNS、证书和配置都纳入切换。多活明确写入归属、冲突、全局 ID 和回切合并。

## 5. 切流与回切

![地域故障切流与受控回切](/architecture/infrastructure-region-failover.svg)

Declare→停止/隔离旧写主→确认数据恢复点→提升备用→切 DNS/GSLB→渐进流量→验证业务→保持旧区 fenced。回切先同步差异、验证，再 canary；不能自动来回摆动。

## 6. GameDay

演练 Pod/Node/AZ、依赖超时、证书/Secret 轮换、控制面、主库恢复和 Region 切流。记录发现、决策、实际 RTO/RPO、数据差异和人工步骤。生产演练控制范围并有 abort。

## 7. 成本与可靠性

冗余容量是可靠性成本。按 SLO/业务价值选择，不盲目双活也不把所有余量削掉。成本标签、利用率、跨区流量和空闲资源与错误预算共同评审。

## 8. 上线检查

- 副本和依赖是否跨真实故障域，单 AZ 后容量是否足够？
- HPA 指标、启动延迟、连接预算和缩容排空是否验证？
- RTO/RPO 是否按业务分级并决定匹配 DR 策略？
- 切流是否包含数据权威、fencing、身份、队列和配置？
- 回切是否同步/校验/canary，避免双主与摆动？

下一篇：[Java 生产参考架构](/architecture/infrastructure/reference)。
