# 身份上下文、授权、数据裁剪与审计

网关验证凭证后，BFF 依然要确认身份上下文来自可信链路，并把它显式传给用例与下游。BFF 可执行终端级、API 级和字段级的展示裁剪，但不能替代资源所有者的最终授权。

## 1. 上下文传播链路

![BFF 请求上下文的建立与传播](/architecture/bff-context-propagation.svg)

`RequestContext` 可包含：

- request ID、trace/span context、入口时间与 deadline。
- subject ID/type、tenant ID、client/application ID、scope/role 摘要、认证强度。
- channel、App 版本、locale、time zone、受控设备/风险标识。
- 发布/实验桶与必要合规地域。

上下文要有类型、大小上限和明确来源。不把所有 Header 复制成 `Map<String,String>` 并在业务代码中到处查找。

## 2. 可信来源

1. 网关已删除外部伪造的身份 Header。
2. 网关到 BFF 使用受信任网络、mTLS 或内部签名 Token。
3. BFF 校验必需声明、格式和租户/主体组合，不在冲突时随意优先某个 Header。
4. BFF 对下游传播最小声明，不把外部 Token 无限扩散。
5. BFF 本身不应有可绕过网关的公网入口；健康/管理端口单独隔离。

## 3. ThreadLocal、Reactor Context 与异步

Spring MVC 同步请求中可用 request-scoped 参数解析器，但不应在领域层随处静态读 ThreadLocal。显式将主体和租户传给用例，测试、批处理和消息消费者才不依赖 Web 线程。

`CompletableFuture`、自定义线程池、Reactor 和虚拟线程都可改变上下文传播方式。不假设 MDC/SecurityContext 自动跨调度器传递；使用框架支持的上下文机制，并用测试验证并行分支和回调中不串请求。

## 4. 授权分工

| 决策 | 合理所有者 |
|---|---|
| 该 App/subject 能否访问某 API | 网关粗粒度策略 |
| 这个终端响应是否展示某字段 | BFF 展示契约 + 下游授权结果 |
| 当前用户是否可读/改订单 123 | 订单服务，掌握对象与关系 |
| 当前订单状态是否允许取消 | 订单领域 |
| 运营人员能查哪些门店/字段 | 资源所有者执行行/字段授权，BFF 裁剪展示 |

不能因为 BFF 已隐藏“取消”按钮，就认为取消 API 不需授权。UI 能力只是用户体验提示，命令执行时必须以最新数据重新判断。

## 5. 字段与行级数据安全

- 过滤必须下推到数据所有者/查询，不能在 BFF 先拉全量再用 Java 删除，否则已经越权读取并浪费资源。
- 响应 DTO 使用显式白名单，不用“序列化全部后再黑名单屏蔽几个”。
- 批量/导出接口使用与单资源相同的授权语义，不因为“只有后台用”而放宽。
- 缓存和 DataLoader Key 包含租户、主体/权限变体，不跨用户复用已裁剪结果。

## 6. 代理与 On-behalf-of

管理员代用户操作、客服代理、服务调服务时，必须同时保留：

- 实际行为主体（actor）。
- 被代表用户/租户（subject/on-behalf-of）。
- 代理原因、工单/会话、认证强度和时间窗口。
- 该代理方式允许的动作和禁止的高风险动作。

审计不能只记被代表用户，否则无法知道真正操作者。

## 7. CSRF、CORS 与 Cookie BFF

使用浏览器 Cookie Session 的 Web BFF 必须防 CSRF：`SameSite`、CSRF Token、Origin/Referer 校验和敏感动作再认证按风险组合。CORS 不是 CSRF 完整防护，也不是认证。

Token-mediating BFF 可将 OAuth Token 保留在服务端，浏览器只持有 HttpOnly/Secure Session Cookie，减少 Token 被 JS 窃取。代价是 BFF 需管理会话、CSRF、Token 刷新、注销、横向扩展与故障恢复。

## 8. 审计与普通访问日志

| 类型 | 目的 | 保留内容 |
|---|---|---|
| 访问日志 | 性能、错误、调用追踪 | API、状态、耗时、大小、request/trace ID，严格脱敏 |
| 安全事件 | 鉴权/越权/异常行为分析 | actor/subject、资源、策略、结果、风险信号 |
| 业务审计 | 回答谁何时为何改了什么 | 业务用例与结果、前后值摘要，由资源所有者产生 |

BFF 可产生接入事件，但不能代替业务服务记录“事务已成功改变资源”。

## 9. 上线检查

- 身份 Header 来源是否可验证，BFF 是否不可被绕过直连？
- `RequestContext` 是否有强类型、最小声明和大小上限？
- 线程/调度器切换后 SecurityContext、MDC、Trace 和 deadline 是否不丢失/串请求？
- 资源级授权是否仍在数据所有者执行？
- 行级过滤是否在查询中执行，不是拉回 BFF 再删？
- 缓存/DataLoader 是否不跨租户/权限复用数据？
- 代理操作是否同时审计 actor 和 subject？
- Cookie BFF 是否完整处理 CSRF、Session、Token 刷新与注销？

下一篇：[错误契约、国际化与客户端兼容](/architecture/access/errors)。
