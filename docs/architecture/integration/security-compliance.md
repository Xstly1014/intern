# 外部身份、请求签名、Secret 与数据合规

外部集成跨越组织信任边界。每个供应商需要独立服务身份、最小权限凭证、出站目标限制和数据处理清单；不能共享永久 API Key 或把生产 Secret 放在普通配置与日志中。

## 1. 认证方式

| 方式 | 适用 | 关键控制 |
|---|---|---|
| OAuth Client Credentials | 机器 API | audience/scope、短期 Token、缓存与刷新 |
| mTLS | B2B 强身份 | 双向证书、SAN、CA/轮换、私钥保护 |
| HMAC 请求签名 | Webhook/API 完整性 | 原始规范化串、timestamp、nonce、key ID |
| API Key | 简单供应商 | 每环境/服务独立、最小权限、轮换 |
| 云角色联邦 | 云服务访问 | 短期身份、条件策略、无静态 Key |

Basic/永久 Token 只能在供应商限制下使用，并通过代理/Secret Manager 限制爆炸半径。

## 2. Secret 生命周期

![供应商 Secret 从签发到撤销的生命周期](/architecture/integration-secret-lifecycle.svg)

Secret 记录 owner、provider、用途、环境、Scope、签发/到期、使用方和轮换手册。轮换先让双方接受新旧，再切换使用，观察旧 key 流量归零后撤销。紧急泄露路径不等待常规周期。

应用通过 workload identity 从 Secret Manager 获取，避免 Git、镜像、命令行、环境全集日志和 Heap dump。缓存有 TTL，刷新失败使用旧值不能超过有效期。

## 3. 出站网络与 SSRF

Adapter 目标由服务端配置和 allowlist 决定，限制 scheme、domain、port；DNS 解析后拒绝内网/metadata，重定向重新验证。通过出站代理/网络策略只开放必要供应商目标，记录目标类别和 bytes，不记录凭证。

供应商返回的 callback/download URL 同样不可信，不能直接请求。

## 4. 数据最少化

![向第三方披露数据的目的与字段控制](/architecture/integration-data-disclosure.svg)

对每个字段记录业务目的、法律依据/同意、供应商、地域、保留、删除和是否可选。Adapter 白名单构造 Payload，不序列化完整用户/订单对象。使用 Tokenization/供应商 vault 避免本方接触卡号等高敏数据。

供应商二次处理、子处理者和模型训练用途需合同与配置限制；测试/Sandbox 不发送真实生产个人数据。

## 5. 日志与证据

可记录 internal/provider request ID、接口、签名 key version、结果类别、耗时、数据分类标签和响应哈希。禁止 Authorization、Secret、完整签名串、卡号、证件和未经批准 Body。

合规审计回答谁在何目的向哪个供应商发送了哪些数据类别，不需要把明文复制到日志。

## 6. 供应商访问本方

Webhook、SFTP、支持门户账号和 VPN 都使用独立供应商身份、最小资源范围、到期和 MFA/mTLS。供应商工程师不能默认访问生产；临时支持访问走审批、限时、录屏/审计和数据遮蔽。

## 7. 退出与删除

终止供应商时撤销凭证、网络、账号和 Webhook，导出必要数据，取得删除证明，更新子处理者清单。内部缓存、DLQ、回调原文和 Sandbox 数据同步清理。

## 8. 上线检查

- 每供应商/环境是否有独立短期或可轮换凭证与最小 Scope？
- 签名规范化、timestamp、nonce、算法和 key rotation 是否测试？
- 出站目标是否 allowlist + DNS/IP/重定向复检？
- 每个出站字段是否有目的、地域、保留、删除和最小化依据？
- Sandbox、日志、Trace、DLQ 是否不泄露真实敏感数据？
- 供应商退出是否能撤销所有身份、网络、数据和回调路径？

下一篇：[韧性、配额与多供应商](/architecture/integration/resilience-routing)。
