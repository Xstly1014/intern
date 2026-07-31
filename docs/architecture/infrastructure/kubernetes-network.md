# Kubernetes 调度、工作负载与网络隔离

Kubernetes 负责把声明状态持续收敛为运行实例，不保证应用正确、数据一致或无损发布。控制器、调度、探针、网络和中断预算必须与业务语义配合。

## 1. 控制面与数据面

![Kubernetes 声明状态到 Pod 的调和链](/architecture/infrastructure-k8s-reconcile.svg)

API Server 保存声明，Controller 创建 Replica/Pod，Scheduler 按资源、污点、亲和和拓扑选择 Node，Kubelet/Runtime 启动容器，Service/Endpoint 将 Ready Pod 暴露。控制面短暂不可用时现有 Pod 可运行，但新调度/变更受阻。

## 2. 工作负载类型

Deployment 管无状态副本；StatefulSet 提供稳定身份/卷顺序但不自动实现数据库一致性；Job/CronJob 负责有限任务但可能重复；DaemonSet 每节点运行 Agent。按生命周期选择，不因名字“有状态”就部署数据库。

## 3. 调度与故障域

requests 保证 Scheduler 有依据。topologySpread/anti-affinity 将副本分散 Node/AZ；PodDisruptionBudget 只约束自愿中断，不能阻止节点故障，也不能替代足够副本/容量。PriorityClass 用于核心服务并防止所有工作负载同级抢占。

## 4. 网络边界

![公网、应用、数据与管理网络分区](/architecture/infrastructure-network-zones.svg)

入口经 LB/Gateway；应用 Namespace 默认拒绝东西向，只开放明确 source→port；数据面只接受所属服务身份；Egress 经 allowlist/代理，阻断 metadata/管理网；管理面独立身份、MFA 和审计。

NetworkPolicy 需 CNI 真正执行，并测试 DNS、探针和控制面必要流量。

## 5. Service 与连接

Service/DNS 地址变化，客户端连接池设置 DNS/连接寿命、timeout 和退避。readiness 摘除只影响新连接，旧 keepalive/HTTP2 流需 drain。Ingress、Service、Mesh 和应用 timeout 形成一条预算，不层层独立重试。

## 6. Service Mesh

Mesh 可统一 mTLS、身份、流量策略和遥测，代价是 Sidecar/ambient 资源、控制面、证书和调试复杂度。只有规模/治理收益成立时使用；业务对象授权、幂等和降级仍在应用。

## 7. 多租户集群

Namespace 不是强安全边界。结合独立账户/集群、RBAC、NetworkPolicy、ResourceQuota、LimitRange、Pod Security、节点池和 Secret 权限。生产与非生产至少账户/凭证/数据严格隔离。

## 8. 上线检查

- 副本是否跨 Node/AZ 分布并有故障容量？
- PDB、滚动参数和 Cluster Autoscaler 是否不会互相卡死？
- 默认拒绝网络是否验证了入口、东西向、数据和 Egress？
- readiness 摘流和已有连接 drain 是否正确？
- Mesh/Ingress/Client 重试和 timeout 是否避免放大？

下一篇：[IaC、环境与 Secret](/architecture/infrastructure/iac-environments)。
