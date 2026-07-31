# 负载均衡与反向代理：把流量送到健康实例

负载均衡器（Load Balancer）在多个后端之间分配流量，反向代理则代表后端接收客户端请求，并执行协议终止、路由、Header 处理和连接管理。两者经常由同一个产品承担，但设计时要区分 L4 连接调度与 L7 HTTP 请求调度。

## 1. L4 与 L7 的差异

| 维度 | L4 负载均衡 | L7 负载均衡/反向代理 |
|---|---|---|
| 观察内容 | IP、端口、TCP/UDP/QUIC | Host、Path、Method、Header、Cookie |
| 调度单位 | 连接/流 | HTTP 请求或流 |
| TLS | 常见透传，也可部分终止 | 常在此终止并理解 HTTP |
| 性能 | 开销较低、吞吐高 | 功能丰富但解析成本更高 |
| 路由 | 目标地址/端口 | 域名、路径、版本、Header |
| 典型用途 | 公网入口、数据库代理、非 HTTP | Web/API Ingress、网关前置 |

HTTP/2 多个请求共享一个连接。若 L4 只在连接建立时选择后端，单个长连接中的所有请求可能固定到一个后端；L7 终止 HTTP/2 后可以按请求重新调度。

## 2. 常见部署拓扑

![L4 与 L7 负载均衡部署拓扑](/architecture/load-balancing-topology.svg)

不必机械叠加多层代理。每增加一层都会增加延迟、超时配置、Header 信任、日志关联和故障面。只有当全球调度、网络入口、协议终止和业务网关确实需要不同生命周期时才分层。

## 3. 调度算法

### Round Robin

请求依次分配，简单且适合同质实例、请求成本相近的场景。不会考虑正在处理的长请求。

### Weighted Round Robin

按容量或版本权重分配，可用于不同规格实例和粗粒度灰度。权重必须与真实容量校准，不能只按 CPU 核数。

### Least Connections / Least Requests

选择活跃连接/请求较少的实例，适合请求耗时差异较大。HTTP/2、WebSocket 等长连接下，连接数不一定代表负载。

### Consistent Hash / Ring Hash

按用户、Cookie、Header 或源 IP 哈希，让同一 Key 稳定落到后端。用于缓存亲和、部分有状态连接或稳定灰度；实例变化会迁移部分 Key。热点 Key 仍可能压垮单实例。

### Peak EWMA / Latency-Aware

结合延迟与未完成请求选择后端，能避开变慢实例，但若无探索机制可能让恢复实例长期没有流量。延迟信号也可能把压力转移形成震荡。

### Power of Two Choices

随机选两个后端，再选负载较低者，以较低协调成本获得较好分布，适合大规模实例。

## 4. 健康检查三层语义

### Liveness

进程是否存活。失败通常触发进程/容器重启。它不应依赖数据库等外部系统，否则下游抖动会导致全体实例重启风暴。

### Readiness

实例能否接收新流量。应用启动未完成、正在优雅下线、本地关键资源耗尽时应 not ready。外部依赖是否纳入，要权衡：数据库全局故障时把所有实例都摘掉并不会恢复数据库。

### Deep/Synthetic Health

从用户入口执行代表性业务探测，用于地域/GSLB 决策和告警，不适合作为每秒摘实例的本地健康检查。

### 健康检查参数

| 参数 | 风险 |
|---|---|
| Interval | 太短增加负载，太长发现慢 |
| Timeout | 必须小于间隔；过短对抖动敏感 |
| Unhealthy Threshold | 太小容易误摘，太大恢复慢 |
| Healthy Threshold | 防止实例在好坏之间抖动 |
| Expected Status/Body | 只看 TCP 会放过应用故障 |

健康路径应轻量、无认证或使用专用受控认证，并防公网滥用。不要返回依赖 Secret、详细版本和内部拓扑。

## 5. 连接的两段模型

反向代理终止客户端连接后，存在两组独立连接：

![反向代理前端连接与后端连接的两段模型](/architecture/proxy-two-connections.svg)

两侧协议、连接池、TLS 和超时可以不同。例如客户端到 LB 使用 HTTP/2，LB 到后端使用 HTTP/1.1 Keep-Alive。后端连接池不足会在代理内排队，即使 Java 服务 CPU 很低。

### 关键容量指标

- Active connections：当前并发连接。
- New connections/s：新建连接速率，影响 TLS 和 conntrack。
- Requests/s：HTTP 请求速率。
- Pending/queued requests：等待后端连接的请求。
- Backend connection reuse：后端连接复用率。
- Reset/timeout：前端和后端分别统计。

## 6. 超时必须成套设计

| 超时 | 作用 |
|---|---|
| Client Header Timeout | 等待完整请求 Header |
| Client Body Timeout | 等待请求体上传 |
| Frontend Idle Timeout | 客户端连接无数据多久关闭 |
| Backend Connect Timeout | 连接后端实例的上限 |
| Backend Response Timeout | 等待后端首字节/响应的上限 |
| Backend Idle Timeout | 与后端 Keep-Alive 空闲时间 |
| Stream/WebSocket Idle | 长连接无事件/心跳上限 |
| Drain Timeout | 下线时等待在途请求的上限 |

如果 LB 后端空闲超时 60 秒，而 Java/服务网格 30 秒静默关闭，LB 可能复用已经失效的连接，产生间歇性 502。各层空闲超时和 Keep-Alive 要按连接方向协调，并能安全重连。

## 7. 优雅启动和下线

### 启动

1. 进程启动但 readiness 为失败。
2. 加载必要配置、建立最小资源、JIT/缓存可选预热。
3. readiness 成功，LB 健康阈值通过。
4. 逐步接流，避免新实例瞬间被打满。

### 下线

1. 收到部署/缩容信号，readiness 失败。
2. LB 停止分配新请求，传播摘流状态。
3. 等待在途请求、WebSocket/流式连接和 MQ 处理收敛。
4. 到达 drain timeout 后取消剩余工作并退出。

终止宽限期必须覆盖 LB 健康发现时间 + 在途请求上限 + 资源清理时间。立即 SIGKILL 会产生 502 和重复请求。

## 8. 会话保持

无状态 HTTP 服务优先不使用粘性会话。身份由 Token/Cookie 表达，共享状态放在受控数据服务。必须粘性时：

- Cookie 粘性通常比源 IP 更可靠；NAT 会让大量用户共享 IP。
- 设置有限 TTL，实例故障时允许重新选择。
- 不能依赖粘性保证数据正确，实例随时会消失。
- 灰度版本需要稳定且可回滚的路由 Cookie/哈希。

WebSocket 建立后天然绑定到一个实例，断开重连可能落到其他实例，因此订阅状态需可恢复，使用游标/会话 ID，而非只在内存保存。

## 9. 跨可用区与拓扑感知

跨区负载均衡提升故障容忍，但增加延迟和流量成本。常见策略：

- 正常优先同区，区内容量不足或故障时跨区溢出。
- 每区部署足够冗余，能承受一个区故障后的剩余流量。
- 平衡实例分布，避免某区实例少却接收相同流量。
- 监控跨区比例和故障切换后的数据库/缓存依赖路径。

只把应用分散到多区，而数据库、NAT 或 LB 仍单区，不构成真正多区高可用。

## 10. 真实 IP 与代理协议

L4 代理可使用 Proxy Protocol 传递源/目标连接信息，前后端必须同时启用，否则后端会把协议头当业务数据。L7 常用标准 `Forwarded` 或 `X-Forwarded-*`：

- `X-Forwarded-For`：客户端和代理链 IP。
- `X-Forwarded-Proto`：原始 http/https。
- `X-Forwarded-Host`：原始 Host。
- `X-Forwarded-Port`：原始端口。

边界代理删除外部伪造值，内部代理只信任明确上游。Java 框架的 Forwarded Header 支持必须只在受信代理后开启，否则客户端可伪造安全 Scheme、重定向 Host 或 IP。

## 11. Host、SNI 与路由

TLS 在 HTTP Header 之前完成，服务器先用 SNI 选择证书，再用 Host/`:authority` 选择路由。两者不一致时应采用明确拒绝策略，防止域名前置和错误路由。默认虚拟主机不应暴露管理页面或任意代理。

路由配置关注：

- 精确 Host 优先，拒绝未知 Host。
- Path 规范化：重复斜杠、`..`、编码字符和大小写规则一致。
- 路由重写后保留原始信息用于审计，但不信任外部 Header。
- 管理端和公开 API 使用独立入口或严格策略。

## 12. 代理重试和故障选择

后端连接失败时，LB 可以选择另一健康实例，但只对安全、幂等请求执行。请求体已经部分转发或后端可能已执行时，自动重试 POST 风险很高。代理被动健康可根据连接错误临时驱逐实例，主动健康负责恢复。

重试需要总预算、最大次数、避免同一实例，并传播尝试次数供诊断。网关和客户端若也重试，需要明确唯一负责层。

## 13. Java 服务交界面

### Spring Boot/Tomcat

- 配置正确的 graceful shutdown 和 readiness。
- `server.forward-headers-strategy` 只在可信代理拓扑下启用。
- Tomcat `max-connections`、`accept-count`、线程池和请求大小与 LB 上限协调。
- 不在健康检查中执行慢 SQL 或级联所有依赖。

### WebFlux/Netty

- 事件循环不能执行阻塞 JDBC/SDK。
- 观察 event loop pending task、直接内存和连接池。
- LB 的 HTTP/2、WebSocket 和流式超时与 Netty 行为对齐。

### Kubernetes

- readinessProbe 在容器端标记接流状态，Service/Ingress 更新需要传播时间。
- `preStop`、terminationGracePeriodSeconds 和 LB deregistration delay 共同设计。
- 避免只 sleep 固定秒数而不验证在途请求是否排空。

## 14. 指标与排障

按 frontend/backend、Listener、Target Group、可用区和状态码观察：请求率、活跃/新建连接、健康后端数、排队、目标响应时间、LB 自生成 4xx/5xx、后端 4xx/5xx、reset、TLS 错误和跨区流量。

常见判断：

| 现象 | 可能原因 |
|---|---|
| LB 502，后端无请求日志 | 连接失败、协议/TLS 不匹配、复用失效连接 |
| LB 504，后端最终成功 | LB 响应超时小于后端执行时间 |
| 单实例过热 | 粘性、长连接、算法或权重不合理 |
| 部署时短暂 5xx | readiness/摘流传播/优雅停机不协调 |
| 客户 IP 全是代理 | Forwarded/Proxy Protocol 未正确配置 |
| 大请求 413 | CDN/LB/网关/应用任一层大小限制 |

## 15. 上线检查清单

- [ ] 明确每层 L4/L7 的存在理由和所有者。
- [ ] 调度算法适合短请求、长请求或长连接特征。
- [ ] Liveness、Readiness、深度探测职责分离。
- [ ] 前后端连接池、空闲和响应超时对齐。
- [ ] 启动预热、健康阈值、摘流和优雅停机经过演练。
- [ ] 会话默认无状态；粘性和 WebSocket 有故障恢复方案。
- [ ] 多区容量能承受故障，跨区延迟和成本可见。
- [ ] Forwarded/Proxy Protocol 信任链和伪造测试通过。
- [ ] Host、SNI、Path 规范化和未知路由默认拒绝。
- [ ] LB 重试仅限安全请求，和客户端/网关策略不叠加。

下一篇：[TLS 与 HTTP 协议](/architecture/edge/protocol-tls)。
