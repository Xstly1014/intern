# 基础设施即代码、环境隔离、State 与 Secret

IaC 把网络、集群、数据库、IAM 和策略变成可评审、可重建的声明。它不只是 Terraform 文件，而是 Plan、State、权限、漂移、升级和灾难恢复流程。

## 1. IaC 生命周期

![IaC 从代码到调和与漂移检测](/architecture/infrastructure-iac-lifecycle.svg)

模块版本→环境参数→fmt/validate/security→Plan→评审/审批→短期 CI 身份 Apply→状态锁定→验证→持续 Drift 检测。生产禁止个人长期凭证直接 apply。

## 2. State

State 含资源 ID 和可能敏感属性，远端加密、版本化、锁定、最小访问并备份。State 丢失/损坏恢复要演练；不要手工编辑绕过工具。导入既有资源后核对差异。

## 3. 模块与环境

模块提供有版本的安全默认值，不做一个包含所有场景的巨型模块。环境使用相同模块与不可变制品，只改变受控参数；生产/测试账户、网络、KMS、数据和 CI Role 分离。

## 4. Drift 与控制台变更

定时 Plan 检测漂移并路由 owner。紧急控制台变更需 Break-glass、审计、TTL，并立即回写 IaC 或回退。忽略 drift 会让下次 Apply 覆盖救火改动。

## 5. Secret 管理

![Workload Identity 获取短期 Secret](/architecture/infrastructure-secret-delivery.svg)

工作负载用 ServiceAccount/云 IAM 向 Secret Manager 认证，按用途读取短期 Secret；不进入 Git、Plan 输出、镜像、ConfigMap 和日志。轮换支持新旧重叠、使用方观测、撤销和故障回滚。

## 6. Policy as Code

在 PR/Admission 检查公网暴露、加密、标签、Region、IAM wildcard、镜像签名、资源 limit 和备份。策略分 deny/warn，版本化、有测试和例外到期，避免无解释阻断。

## 7. 销毁与临时环境

临时环境有 owner、TTL、成本标签和自动销毁；销毁前保护数据库/备份和法律保留。destroy Plan 与 create 同级审批，生产资源 prevent-destroy 只是防线，不是授权流程。

## 8. 上线检查

- IaC 是否覆盖生产资源、IAM、网络、监控和备份？
- State 是否加密、锁定、版本化、备份并演练恢复？
- Apply 是否使用短期 CI 身份、Plan 审批和审计？
- 环境/账户/密钥/数据是否隔离且使用同模块？
- Drift、Break-glass 和策略例外是否有 owner/到期？

下一篇：[CI、制品与供应链](/architecture/infrastructure/ci-supply-chain)。
