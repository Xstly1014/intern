# 容量、可观测与故障排查

网关是观察公网 API 的最好入口之一，但它看到的“请求已返回 200”不一定代表业务成功，“网关返回 502”也不一定是网关代码出错。观测模型必须将下游客户端、网关处理、每次上游尝试和最终响应分开。

## 1. 网关遥测模型

![API 网关指标、日志与 Trace 关联](/architecture/gateway-observability.svg)

一条请求应能通过 request ID/trace ID 关联：

- 边缘/LB 的入口记录。
- 网关的路由、主体、策略命中和最终状态。
- 每次上游尝试的实例、连接、状态与耗时。
- BFF/业务服务的 Trace 和业务结果。
- 网关配置版本和应用发布版本。

## 2. RED 指标与关键维度

### Rate

- 原始请求率，不包含内部重试。
- 上游尝试率，与原始请求比较可见重试放大。
- 请求/响应字节率、新建连接率、TLS 握手率。
- 按 route、consumer type、region、release 的流量。

### Errors

- 下游最终 4xx/5xx。
- 网关本地产生的 400/401/403/404/413/429/503。
- 上游返回的状态码与网关映射后状态码。
- Connect timeout、response timeout、reset、TLS/protocol error、no healthy upstream。
- 限流、熔断、负载舍弃和鉴权失败原因。

### Duration

- 网关总耗时：从接受完整请求到完成响应。
- 网关本地处理耗时：路由、鉴权、限流、Filter。
- 上游连接池排队、Connect、TTFB 和响应传输耗时。
- 每次尝试耗时和总重试延迟。

必须使直方图且保留 P50/P95/P99，平均延迟会隐藏排队和少量慢请求。

## 3. 标签基数治理

适合指标标签：`route_id`、`upstream_cluster`、`status_class`、`region`、`gateway_version`、`release_bucket`。

不适合直接做指标标签：用户 ID、请求 ID、完整 URI、任意 Query、IP、Token、无界租户 ID。它们会导致时序爆炸和监控系统不可用。

路径必须归一化为路由模板：`/orders/123` 和 `/orders/456` 都记为 `/orders/{id}` 或稳定 `route_id`。未匹配路由可归为 `unmatched`，不把攻击者生成的每个随机 Path 变成新时序。

## 4. 访问日志字段

建议结构化记录：

| 类别 | 字段示例 |
|---|---|
| 关联 | timestamp、request_id、trace_id、region、gateway_instance |
| 请求 | method、normalized_route、host、protocol、request_bytes |
| 主体 | subject_type、tenant/app 的受控标识或哈希，不记凭证 |
| 策略 | auth_result、rate_limit_policy、canary_bucket、matched_rule |
| 上游 | cluster、instance/zone、attempt_count、connect_time、upstream_status |
| 响应 | final_status、response_bytes、duration、error_category |
| 版本 | gateway_build、config_version、route_revision |

日志应在请求结束时写一条总结记录，必要时再为每次上游尝试写子记录。不要在每个 Filter 无约束打多行文本，否则无法关联且攻击时日志 I/O 反而拖垮网关。

### 日志反压

日志管道不可用时，数据面不应无限阻塞。使用有界缓冲、分级采样和丢弃计数：审计类记录使用更可靠独立通道，普通成功访问可采样，错误与高风险事件优先保留。必须监控丢弃数量，否则事故期间看到的“错误变少”可能只是日志丢了。

## 5. Trace 传播

- 对外部 `traceparent` 做格式验证，不将任意长度值进入内部系统。
- 保持同一 trace，网关创建 server span，每次上游尝试创建 client span。
- 重试不要覆盖第一次尝试，否则只看到最终成功。
- 在 span 中记录 route ID、upstream cluster、尝试号和错误类别，不记录 Token 和未脱敏 Body。
- 采样决策尽量向下传播；可用 tail sampling 保留错误和慢 Trace。

## 6. 容量模型

网关容量不是一个 QPS 数字。至少需要以下维度：

| 资源 | 主要驱动因素 |
|---|---|
| CPU | TLS 新建连接、JWT/签名、Header/JSON 解析、压缩、日志 |
| 内存 | 并发请求、Body 缓冲、连接、路由快照、指标标签 |
| 新连接/s | TCP/TLS、证书校验、conntrack、端口 |
| 并发连接 | Keep-Alive、HTTP/2、WebSocket、SSE、慢客户端 |
| 带宽 | 请求/响应大小、上传、镜像、重试 |
| 上游连接 | 集群数、协议、每实例连接池、请求耗时 |

基础关系：

```text
平均在途请求 ≈ RPS × 平均网关停留时间
响应出口带宽 ≈ RPS × 平均响应字节 × 8 × 协议/峰值系数
上游尝试率 = 原始请求率 × 平均尝试次数
```

压测要覆盖多种 profile：小响应高 RPS、大 Body、新连接、JWT 验签、HTTP/2 多流、长连接、上游慢/失败、日志出口受阻。给出单实例安全容量而不是极限峰值，并保留实例失效和发布窗口余量。

## 7. SLO 与告警

网关可用性 SLI 应排除明确客户端错误，但包含网关产生的 5xx、无健康上游、超时与意外限流。同时建立两类 SLO：

- **网关自身 SLO**：排除明确上游应用 5xx，衡量路由、鉴权、转发和本地开销。
- **端到端 API SLO**：包含上游结果，代表用户真实体验。

用短窗口 + 长窗口多窗口燃烧率告警，避免对瞬时毛刺频繁告警，也能快速发现大规模事故。配置版本分歧、无健康上游、事件循环卡顿、排队深度和日志丢弃则需症状型告警。

## 8. 状态码快速定位

| 状态 | 首先确认 |
|---|---|
| 400 | URI/Header/Body 限制、协议解析、上游原始响应 |
| 401 | Token 缺失、签名、issuer/audience、过期、JWKS/introspection |
| 403 | 网关路由策略、WAF 还是业务资源授权 |
| 404/405 | 路由未匹配、Method 错误还是上游返回 |
| 413 | CDN/LB/网关/上游哪一层 Body 上限 |
| 429 | 哪个策略和哪个 Key 命中，还是上游过载 |
| 502 | DNS/建连/TLS/协议/无效响应/复用失效连接 |
| 503 | 无健康上游、熔断、负载舍弃、上游维护 |
| 504 | 连接池排队、Connect 还是 Response Timeout |

错误响应中应有不泄露内部细节的稳定错误码与 request ID；内部日志使用更细 `error_category`。

## 9. 排障顺序

1. **确认影响面**：哪些地域、路由、租户、客户端版本，从何时开始。
2. **分开本地与上游错误**：查看 `error_category`、upstream status 和尝试记录。
3. **关联变更**：网关 build、配置版本、上游发布、凭证/证书轮换、DNS/网络变更。
4. **查资源与排队**：CPU、内存、事件循环、连接、上游 pending、日志反压。
5. **查策略命中**：限流、熔断、被动摘除、灰度、认证原因。
6. **止血**：回滚配置/版本，停止重试放大，隔离慢路由，切换健康上游，收紧低优先级流量。
7. **验证恢复**：用外部探测、业务指标和错误预算验证，不只看进程存活。

## 10. 上线检查

- 原始请求与上游尝试是否分别计数？
- 网关本地状态码与上游原始状态是否可区分？
- 延迟是否拆分为本地处理、排队、建连、TTFB 和传输？
- 指标标签是否使用归一化路由，没有用户 ID 和完整 URI？
- 日志阻塞/丢弃时是否不拖垮数据面且可观测？
- 每次重试是否在 Trace 中保留独立 span？
- 压测是否覆盖真实协议、Body、连接和故障 profile？
- 告警是否能指向明确 route/upstream/region 和所有者？

下一篇：[生产参考架构与检查清单](/architecture/gateway/reference)。
