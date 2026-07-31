# Java 基础设施与交付生产参考架构

参考架构从受保护源码开始，在隔离 CI 中生成签名镜像，经策略验证和环境晋级进入 Kubernetes；入口、网络、身份、Secret、观测、数据服务和灾备共同形成可重复运行环境。

## 1. 生产参考拓扑

![Java 基础设施与交付生产参考拓扑](/architecture/infrastructure-reference-topology.svg)

- Git/PR 是变更入口，IaC 与应用同样评审。
- CI 使用 OIDC 短期身份，生成 SBOM/provenance/签名 digest。
- CD 验证策略，应用兼容迁移，再 canary 与 SLO 门禁。
- 多 AZ K8s 承载无状态服务，数据服务有独立 HA/备份。
- Workload Identity 获取 Secret/KMS/云资源，不使用静态 Key。
- OTel/变更事件和服务目录贯穿发布、运行与事件响应。

## 2. Java 容器基线

固定 JDK/基础镜像 digest；非 root、只读 root、最小 capability；JVM 容器感知并显式内存余量；UTF-8/时区明确；Heap dump 路径/权限/空间受控；Actuator 管理端口不公网暴露。

启动记录版本、配置 hash 和运行资源，不打印 Secret。关闭启用 Spring graceful shutdown，并与 K8s preStop/grace/负载均衡传播共同测试。

## 3. Kubernetes 基线

requests/limits、startup/readiness/liveness、PDB、topology spread、securityContext、ServiceAccount、NetworkPolicy、ResourceQuota 和 HPA 均由平台模板提供安全默认。例外记录原因、owner 和到期。

## 4. 交付状态机

![制品、配置、Schema 与流量的发布状态机](/architecture/infrastructure-release-state.svg)

ARTIFACT_VERIFIED→SCHEMA_EXPANDED→CANARY→PROMOTING→COMPLETED；门禁失败进入 PAUSED/ROLLED_BACK/NEEDS_FORWARD_FIX。每阶段持久记录输入、证据和动作，避免流水线重试重复迁移。

## 5. 测试与验证

- 镜像测试 UID、端口、证书、只读文件系统、启动/终止和 CVE。
- Manifest/Policy 测试资源、探针、权限、网络、PDB 和签名。
- 临时环境验证 IaC 创建/销毁与数据库迁移。
- 负载测试 JVM/Pod/连接/HPA/节点扩容和过载。
- 发布演练门禁失败、回滚、forward fix 和 Feature kill switch。
- GameDay 验证节点/AZ/Region、备份恢复、证书和控制面。

## 6. DORA 与平台指标

跟踪部署频率、变更前置时间、变更失败率、恢复时间，同时关联 SLO/错误预算。平台还看模板采用率、创建服务时间、流水线排队/成功、制品晋级、策略例外、Drift、成本和开发者 Toil。

指标不能激励拆小无意义提交或隐瞒失败；以可持续、安全交付业务价值解释。

## 7. 完整检查清单

### 运行与隔离

- JVM/容器/临时盘/探针/停机是否在真实负载下验证？
- 集群、网络、IAM、环境和管理面是否最小权限隔离？
- 故障域、PDB、HPA 和容量余量是否协同？

### IaC 与供应链

- 资源是否 IaC、State 安全、Plan 评审、Drift 可见？
- 制品是否构建一次、签名、SBOM、provenance、digest 晋级？
- CI/部署是否短期身份且生产不接受未验证制品？

### 发布与恢复

- 应用/API/事件/Schema 是否兼容渐进发布与回滚？
- Canary 是否使用 SLO + 业务指标并处理缺失遥测？
- RTO/RPO、备份恢复、AZ/Region 切换和回切是否实测？

下一篇：[端到端落地与演进](/architecture/practice)。
