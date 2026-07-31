# Java 身份与安全生产参考架构

参考架构将身份提供、网关初检、BFF 会话、工作负载信任、业务授权、数据隔离、密钥平台和安全运营分开。组件可以合并部署，但责任、接口和失败策略必须明确。

## 1. 生产参考拓扑

![Java 系统身份与安全生产参考拓扑](/architecture/security-reference-topology.svg)

### 身份面

IdP/OIDC Provider 管理用户认证、MFA、会话与 Token 签发；工作负载 CA/云 IAM 管理服务身份。两者不要共用永久密钥或混淆用户与服务主体。

### 执行面

网关做 Token 结构和 API Scope 初检，BFF 处理 Cookie/CSRF 与可信上下文，业务服务执行对象授权和审计，Repository/数据库执行租户约束。任何一层都不能因上游“应该检查过”而跳过自己掌握的安全事实。

### 管理和检测面

PAP/PDP 管理策略，KMS/Secret Manager 管理密钥，CI/CD 生成 SBOM 和签名制品，SIEM/审计仓库关联安全事件。管理面使用独立身份、网络和强 MFA。

## 2. Spring Security 过滤链

推荐顺序概念上是：安全 Header/CORS → request/trace → 凭证提取 → Token/Session 验证 → SecurityContext → CSRF（Cookie）→ URL 粗授权 → Controller → 用例对象授权 → 审计。

多条 `SecurityFilterChain` 按明确 matcher 和顺序配置，管理端点与业务端点分开。默认 `anyRequest().denyAll()`，再显式开放健康检查和公开 API。不要用忽略整个路径的方式绕开必要安全 Header 和日志。

## 3. Resource Server 配置基线

- 固定可信 issuer 和允许算法；每个 API 校验准确 audience。
- 将 Scope/Claim 显式映射为内部 Authority，避免默认前缀和语义误解。
- JWT 解码器处理 JWK 缓存和轮换；网络失败策略与启动依赖明确。
- 401 和 403 使用稳定 JSON 错误，不重定向 API 到 HTML 登录页。
- `SecurityContext` 不存领域 Entity，不依赖可变 Claim 做最终对象授权。

## 4. Controller、用例和 Repository 边界

```java
public CancelOrderResult cancel(CancelOrderCommand command, RequestContext context) {
    Order order = orders.findByIdAndTenant(command.orderId(), context.tenantId())
        .orElseThrow(OrderNotFound::new);
    authorization.require(context.subject(), Action.CANCEL_ORDER, order);
    return order.cancel(context.actor(), clock.instant());
}
```

查询一开始就带 tenant，授权读取最新资源事实，领域状态检查和变更发生在同一用例。Controller 的 `@PreAuthorize` 可提前拒绝无基础能力的主体，但不能替代这里的对象检查。

## 5. 密钥与证书轮换

![密钥版本发布与无中断轮换](/architecture/security-key-rotation.svg)

轮换顺序通常是：生成新版本 → 发布验证方信任新旧 → 签发方改用新版本 → 观察旧版本使用 → 等待最大 Token/缓存寿命 → 撤销旧版本。加密密钥还需渐进重加密或读取旧写入新，不能直接删除旧 KEK。

每个 Secret 有所有者、用途、使用方清单、轮换周期、最后使用和紧急撤销手册。Secret 不进入 Git、镜像层、普通配置、命令行参数、Heap dump 和日志。

## 6. 测试矩阵

| 测试层 | 必测内容 |
|---|---|
| 单元 | 策略表、Claim 映射、脱敏、签名/重放边界 |
| Web slice | 无 Token、坏签名、错 issuer/audience、过期、CSRF、401/403 |
| 用例 | 对象归属、跨租户、代理、状态变化、缺属性和策略失败 |
| Repository | tenant 强制、RLS、连接复用、批量/软删除/迁移 |
| 集成 | IdP/JWK 轮换、mTLS、PDP、KMS、审计管道 |
| 攻击测试 | IDOR、SSRF、上传、注入、反序列化、重放和资源耗尽 |
| 演练 | 凭证泄露、CA/IdP 故障、策略误发、跨租户和审计中断 |

只测“管理员能成功”远远不够；拒绝路径、上下文缺失和并发状态变化通常风险更高。

## 7. 发布和故障策略

- 策略、JWK、CA Bundle 和安全配置都版本化、签名、分批发布并可回滚。
- IdP/PDP/KMS 依赖定义超时、缓存和 fail-closed 边界，避免故障时全通。
- 安全修复有紧急发布通道，但仍保留评审、签名和审计。
- Break-glass 有双人审批、最短 TTL、强 MFA、独立告警和事后复核。
- 备份恢复同时验证账户封禁、权限撤销、密钥版本和删除请求不会倒退。

## 8. 完整评审清单

### 身份与会话

- 用户、设备、workload、actor 与 subject 是否建模清楚？
- Token 是否限制 issuer、audience、Scope、算法与寿命，并支持撤销轮换？
- Cookie、CSRF、MFA、恢复与注销是否形成完整会话生命周期？

### 授权与租户

- API、对象、字段、列表、批量、导出和异步入口是否覆盖授权？
- tenant 是否贯穿数据、缓存、消息、搜索、对象、分析和备份？
- PDP/属性故障是否默认拒绝，策略是否可解释、灰度和回滚？

### 数据与应用

- 数据是否按分类最少采集、加密、脱敏、保留和删除？
- SSRF、上传、反序列化、管理端口和资源耗尽是否有代码与平台双重控制？
- 制品是否有依赖锁定、SBOM、provenance、签名和漏洞处置 SLA？

### 运营与恢复

- 高风险动作是否形成完整、不可静默丢失的业务审计？
- 关键攻击是否有检测、负责人、隔离动作、取证和恢复 Playbook？
- Token、证书、Secret、策略、IdP/PDP 故障和跨租户事件是否演练？

下一层是[业务服务层](/architecture/business)：安全层提供可信身份和策略能力，业务服务仍要依据资源事实执行最终授权与领域不变量。
