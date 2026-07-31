# 基础设施与交付层：让系统可重复、安全地运行和演进

基础设施层提供计算、网络、存储、身份、调度与故障域；交付体系把源码变成可验证、不可变、可渐进发布和可回滚的生产版本。目标不是“上 Kubernetes”，而是环境可重建、变更可追踪、容量可证明、失败可恢复。

## 1. 运行与交付版图

![基础设施与交付层能力版图](/architecture/infrastructure-capability-map.svg)

| 能力 | 负责 | 不负责 |
|---|---|---|
| 计算/容器 | 进程隔离、资源、调度 | 业务并发与事务正确性 |
| 网络/入口 | 地址、路由、隔离、TLS 基础 | 对象级授权 |
| Kubernetes | 声明副本、健康、滚动、调度 | 自动解决有状态一致性 |
| IaC | 可审查地创建环境和依赖 | 应用运行时业务配置语义 |
| CI/制品 | 构建、测试、SBOM、签名 | 用扫描替代设计评审 |
| CD | 灰度、门禁、回滚、审计 | 数据库瞬时回滚 |
| HA/DR | 故障域冗余、切流、恢复 | 未演练的纸面 RTO/RPO |

## 2. 从提交到生产

![源码到生产的不可变交付链](/architecture/infrastructure-delivery-chain.svg)

提交经评审与测试，在隔离构建环境生成一次制品、SBOM、provenance 和签名；制品以 digest 晋级各环境，配置/Secret 运行时注入；部署先兼容 Schema，再 Canary，依据 SLO 与业务指标自动暂停/回滚；每次变更关联 commit、制品、配置、迁移、审批和操作者。

禁止在服务器手改文件、不同环境重新编译、使用可变 `latest` 或把 Secret 烧入镜像。

## 3. 运行责任边界

![平台、服务团队与安全团队责任分工](/architecture/infrastructure-responsibility.svg)

平台团队提供 paved road、集群、交付、身份、观测和默认安全；服务团队拥有资源声明、SLO、探针、扩缩容语义、迁移和 Runbook；安全团队定义供应链、IAM、网络与制品策略。托管云服务减少操作，不转移数据、容量和恢复责任。

## 4. 基础原则

- 声明式、版本化、可审查；禁止不可追踪的控制台漂移。
- 制品不可变，配置外置，环境差异最小且显式。
- 最小权限、短期身份、网络默认拒绝、管理面独立。
- 小批量渐进发布，指标门禁，快速停止与可验证回滚。
- 资源有 requests/limits、容量余量、优先级和过载策略。
- HA 与备份/DR 分开设计，并以演练证明。
- 基础设施变更与应用变更进入同一观测时间线。

## 5. 本章专题

| 专题 | 深入内容 |
|---|---|
| [计算、容器与 JVM 资源](/architecture/infrastructure/runtime) | CPU/内存、OOM、临时盘、信号、探针与优雅停机 |
| [Kubernetes 与网络隔离](/architecture/infrastructure/kubernetes-network) | 控制器、调度、PDB、NetworkPolicy、入口与 Mesh |
| [IaC、环境与 Secret](/architecture/infrastructure/iac-environments) | State、Plan、Drift、账户隔离和密钥生命周期 |
| [CI、制品与供应链](/architecture/infrastructure/ci-supply-chain) | 可复现构建、SBOM、签名、来源证明和门禁 |
| [部署、灰度与回滚](/architecture/infrastructure/deployment) | Rolling/Blue-Green/Canary、Schema 兼容和 Feature Flag |
| [高可用、弹性与灾备](/architecture/infrastructure/resilience-dr) | 故障域、HPA、容量、RTO/RPO、切流与回切 |
| [Java 生产参考架构](/architecture/infrastructure/reference) | K8s/CI/CD 全链路、测试、演练和检查清单 |

## 6. 最小上线基线

- 同一签名 digest 跨环境晋级，运行时配置和 Secret 不入镜像。
- JVM/容器资源、探针、SIGTERM 排空和 termination grace 经压测验证。
- 网络、IAM、Namespace/账户按最小权限和环境隔离。
- IaC Plan 有评审，State 加密锁定，Drift 可检测。
- 发布使用兼容变更、Canary 门禁、自动停止和人工可回滚。
- 应用扩容与数据库/下游容量共同建模，故障时保留余量。
- 备份恢复、节点/AZ/Region 故障和流量切换按 RTO/RPO 演练。

下一篇：[计算、容器与 JVM 资源](/architecture/infrastructure/runtime)。
