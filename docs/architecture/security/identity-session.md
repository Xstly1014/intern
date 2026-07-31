# 用户身份、OAuth/OIDC、Token 与会话

用户身份系统的目标不是“登录成功”，而是在不同客户端、风险和生命周期下安全建立会话，限制凭证被盗后的影响，并支持注销、封禁、MFA 升级和账户恢复。

## 1. 推荐登录链路

![OAuth OIDC 授权码与 PKCE 流程](/architecture/security-auth-code-flow.svg)

公网 Web/App 优先使用 OAuth 2.x Authorization Code + PKCE，身份层用 OpenID Connect 提供用户认证。客户端生成 `code_verifier`，只发送其 challenge；回调还要校验 `state`，OIDC 客户端校验 `nonce`、`iss`、`aud` 和 ID Token 签名。

不要使用资源所有者密码模式，不把 Client Secret 内置进 App，也不在前端自己收集第三方账号密码。Redirect URI 使用精确白名单，不能允许开放通配或可控跳转。

## 2. 凭证与用途边界

| 凭证 | 用途 | 关键限制 |
|---|---|---|
| ID Token | 客户端确认登录身份 | 不能作为任意业务 API 通行证 |
| Access Token | 调用指定 Resource Server | 短期、受 `aud/scope` 限制 |
| Refresh Token | 换取新 Access Token | 旋转、重放检测、安全存储 |
| Session Cookie | 浏览器到同源 BFF | HttpOnly、Secure、SameSite、CSRF |
| Authorization Code | 一次性交换 Token | 短期、绑定 client/redirect/PKCE |

## 3. Token 验证必须完整

![Token 从签发到撤销的生命周期](/architecture/security-token-lifecycle.svg)

Resource Server 不能只 Base64 解码 JWT。至少校验：允许的签名算法、签名、可信 issuer、当前 API audience、时间窗口、必要 Scope、Token 类型以及受控的 `kid`。拒绝 `alg=none`、算法混淆和不受信任 JWK URL。

公钥缓存需处理轮换：按 `kid` 查找，未知 Key 时受控刷新，设置缓存与失败策略，不能每请求同步请求 IdP。时钟偏差只给小范围容忍，不能把过期 Token 继续当长期会话。

## 4. JWT 与不透明 Token

| 方案 | 优点 | 代价 |
|---|---|---|
| 短期 JWT | 本地验签、低延迟、IdP 故障时可继续 | 权限和封禁传播有窗口，Claim 易膨胀 |
| 不透明 Token | 服务端集中状态、可即时撤销 | introspection 延迟、缓存和可用性依赖 |
| BFF Session | Token 不暴露给浏览器 JS | BFF 管理会话、CSRF、刷新和横向扩展 |

不要在 JWT 放密码、证件号、完整权限列表等敏感/高变数据。签名只防篡改，不提供保密。

## 5. Refresh Token 旋转和重放

每次刷新签发新 Refresh Token 并使旧 Token 失效。若已失效的旧 Token 再出现，说明同一 Token 家族可能被复制，应撤销该家族、终止相关会话并触发风险检测。移动端存系统安全存储，浏览器尽量使用 BFF 或 HttpOnly Cookie。

## 6. MFA、认证强度与 Step-up

登录时记录认证方式、时间和强度。查看普通数据与修改收款账户的风险不同；高风险动作要求近期重新认证、Passkey/WebAuthn、TOTP 或其他抗钓鱼因子。短信可用于低风险/恢复，但不应是最高风险操作唯一因子。

MFA 不是简单布尔角色。授权策略可要求 `acr/amr`、认证年龄、设备风险和动作类型。恢复码一次性使用并安全哈希；账户恢复本身通常是最弱入口，需要限速、通知和延迟保护。

## 7. Cookie、CSRF、CORS 与 XSS

- Session Cookie 设置 `HttpOnly`、`Secure`、合理 `SameSite`、精确 Domain/Path 和短生命周期。
- 状态变更请求校验 CSRF Token 与 Origin；SameSite 是一层保护，不是全部方案。
- CORS 只控制浏览器跨源读取，不是认证，也不能代替 CSRF 防护。
- XSS 可借用户会话执行操作；CSP、输出编码和避免危险 DOM API 仍是关键。
- 登录、刷新、找回密码和验证码接口按账号、设备、IP/网络组合限速，避免单维度误伤或绕过。

## 8. 注销、封禁和会话管理

注销至少撤销服务端 Session/Refresh Token；短期 Access Token 可等待过期或对高风险账户进入撤销列表。用户应能查看活跃设备、最后活动和认证方式，并终止其他会话。修改密码、关闭账户、管理员封禁时应定义哪些会话立即失效。

## 9. 上线检查

- 是否使用授权码 + PKCE，严格校验 redirect URI、state 和 nonce？
- 每个 API 是否校验准确 issuer、audience、算法、时间与 Scope？
- Refresh Token 是否旋转、检测重放并可撤销整个 Token 家族？
- Cookie 会话是否同时处理 CSRF、XSS、刷新、注销和多实例？
- 高风险动作是否基于认证强度与年龄 Step-up？
- 账户恢复是否比正常登录更严格地限速、通知和审计？

下一篇：[工作负载身份与服务信任](/architecture/security/workload-trust)。
