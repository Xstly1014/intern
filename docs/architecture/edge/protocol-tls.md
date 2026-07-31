# TLS 与 HTTP 协议：连接是怎样建立和复用的

从用户到 Java 服务的“HTTPS 请求”可能经历多段不同协议：客户端到 CDN 是 HTTP/3，CDN 到 LB 是 HTTP/2，LB 到网关是 HTTP/1.1，网关到内部服务是 gRPC。每一次协议转换都会改变连接、超时、Header 和故障语义。

## 1. TCP + TLS + HTTP 请求时序

首次访问传统 HTTPS 大致需要：

![DNS、TCP、TLS 1.3 与 HTTP 首次请求时序](/architecture/tls-http-sequence.svg)

高 RTT 网络中建连成本显著。连接复用、TLS 会话恢复、HTTP/2 多路复用和 HTTP/3 0/1-RTT 能减少后续成本，但也引入新的安全与实现约束。

## 2. TLS 终止位置

### 边缘终止

客户端 TLS 在 CDN/WAF 终止，边缘可缓存和检查 HTTP；边缘到源站再建立独立 TLS。性能和防护能力强，但边缘供应商可见明文，需要信任、合同与数据地域评估。

### LB 终止

CDN 透传或回源 TLS 到云 LB，LB 选证书并转 HTTP/HTTPS 到网关。证书集中管理，内部是否再次加密按威胁模型决定。

### TLS Passthrough

L4 只转发加密连接，由网关/服务终止。端到端密钥控制更强，但上游无法执行 L7 WAF、缓存和路径路由。

### Re-encryption 与 mTLS

外部 TLS 在边缘终止，边缘到源站再 TLS；内部高信任要求可使用 mTLS 同时验证客户端工作负载身份。mTLS 不是普通用户登录，它证明连接端工作负载或设备证书。

## 3. TLS 1.2 与 TLS 1.3

现代公网优先 TLS 1.3，并保留符合兼容需求的 TLS 1.2。禁用 SSLv3、TLS 1.0/1.1 和弱密码套件。TLS 1.3 简化握手和密码套件，默认前向保密。

### 0-RTT 风险

TLS 1.3 会话恢复可发送 0-RTT Early Data，但数据可能被重放。只允许幂等、安全的 GET 等请求使用；支付、创建订单、修改状态不得依赖 0-RTT 防重放。边缘若接受 Early Data，应向后端标记并执行策略。

## 4. 证书链与校验

客户端验证：

1. 当前时间在证书有效期内。
2. 域名匹配 SAN，不再依赖过时 CN 语义。
3. 证书由受信根沿完整中间证书链签发。
4. 签名和密钥算法符合策略。
5. 撤销/CT 等校验按平台策略执行。

服务器常见事故是只部署叶子证书而漏中间证书：某些浏览器因缓存过中间证书可用，其他客户端失败。必须从干净环境和多客户端测试完整链。

## 5. 证书生命周期

- 使用 ACME/云证书服务自动签发和续期。
- 私钥生成、存储和使用限制在 KMS/HSM/受控 LB；禁止进入 Git 和镜像。
- 提前多窗口告警，例如 30/14/7/3/1 天。
- 轮换先部署新证书并验证，再移除旧证书；多边缘节点考虑传播时间。
- 监控证书链、SAN、SNI、OCSP 和实际线上服务证书，不只看配置数据库。
- CAA 限制允许签发的 CA，Certificate Transparency 监控异常签发。

证书更新与 DNS、CDN、自定义域名绑定可能是不同控制面，需要端到端验证。

## 6. SNI、ALPN 和域名

SNI 让客户端在 TLS ClientHello 中发送目标域名，服务器据此选择证书。ALPN 协商 `h2`、`http/1.1` 等应用协议。HTTP/3 基于 QUIC/UDP，通常通过 Alt-Svc 等方式发现。

未知 SNI 应拒绝或使用无敏感默认站点。TLS SNI 与 HTTP Host 不一致可能是误配置或攻击，不应随意代理到任意后端。

ECH（Encrypted ClientHello）旨在隐藏部分 ClientHello/SNI 信息，但部署依赖 DNS HTTPS 记录和客户端/边缘支持，需关注可观测与企业网络策略变化。

## 7. HTTP/1.1

特点：成熟、兼容广；一个连接通常按顺序处理请求，浏览器会开多个连接缓解队头阻塞。必须正确处理：

- Keep-Alive 和空闲超时。
- Content-Length 与 chunked transfer。
- `Expect: 100-continue` 大上传。
- Header 大小、数量和解析一致性。
- 代理间请求走私风险。

HTTP pipelining 实际很少使用。连接过多会增加端口、TLS 和内核状态压力。

## 8. HTTP/2

HTTP/2 在一个 TCP 连接上多路复用多个 stream，Header 使用 HPACK 压缩，并支持流级控制。优势是减少连接和应用层队头阻塞；但底层 TCP 丢包会影响该连接所有 stream。

关键限制：

- 最大并发 stream 数，防止单连接无限并发。
- Header 压缩表和 Header 大小，防资源耗尽。
- 单连接公平性和大响应对其他流影响。
- `RST_STREAM` 速率限制与及时升级，防 Rapid Reset 类攻击。
- LB/代理是否真正端到端支持 h2，还是中间降为 h1。

## 9. HTTP/3 与 QUIC

QUIC 基于 UDP，在用户态集成 TLS 1.3，stream 之间避免 TCP 层队头阻塞，并支持连接迁移（网络 IP 变化时保持逻辑连接）。适合移动网络和较高丢包场景。

部署注意：

- 企业/运营商可能阻断 UDP，客户端必须回退 h2/h1。
- 防火墙、LB、监控和 DDoS 产品需支持 QUIC。
- UDP 缓冲、CPU 和连接 ID 路由需要容量测试。
- 0-RTT 同样有重放风险。
- 边缘到源站未必使用 h3，收益主要在最后一公里。

## 10. gRPC

gRPC 通常基于 HTTP/2 和 Protobuf，适合内部强契约、双向流和低序列化开销。公网浏览器需 gRPC-Web 或代理转换。

设计要点：

- 每次调用设置 deadline，并向下游传播剩余预算。
- 状态码映射不能全部变成 HTTP 200 后丢失语义。
- 流式调用设置消息大小、并发、心跳和背压。
- LB 必须理解 h2 请求或使用客户端负载均衡，否则长连接只落一个实例。
- Protobuf 字段号不可复用，契约向后兼容。

## 11. WebSocket、SSE 与长轮询

| 技术 | 方向 | 适用 | 关键注意 |
|---|---|---|---|
| WebSocket | 双向 | 聊天、协作、实时控制 | 连接状态、心跳、重连、广播 |
| SSE | 服务端→客户端 | 通知、流式文本 | HTTP 友好、事件 ID、断线续传 |
| 长轮询 | 伪实时 | 兼容旧环境 | 请求开销和并发连接 |

长连接穿过 CDN/LB/网关时，每层空闲超时必须大于心跳周期。心跳加随机抖动，避免百万连接整点同时发送。重连使用指数退避，服务端保存可恢复游标；不能假设断线后仍回到原实例。

## 12. 上传、下载和流式响应

### 上传

客户端直传对象存储，使用短期签名；支持分片、并发上限、摘要和完成确认。若经过代理，配置 Body 大小、读取超时和临时磁盘上限，避免代理缓存整个大文件后才转发。

### 下载

使用 Range 和 `206`，正确设置长度、ETag、Content-Disposition。大下载不要占用 Java 工作线程做字节搬运，优先对象存储/CDN。

### 流式响应

代理缓冲必须按路由关闭，否则服务端逐段发送却在代理聚合后一次返回。压缩、WAF 检查和访问日志也可能延迟 stream。客户端取消后应向上游传播取消，释放生成任务。

## 13. CORS 与浏览器边界

CORS 是浏览器读取响应的权限策略，不是服务端认证。关键点：

- Origin 白名单精确匹配，不用反射任意 Origin。
- 携带 Cookie/凭证时不能使用 `Access-Control-Allow-Origin: *`。
- 预检 OPTIONS 的方法、Header 和缓存时间明确。
- CDN 缓存跨 Origin 响应时，缓存键/`Vary: Origin` 必须正确。
- 非浏览器客户端不受 CORS 限制，所以仍需真实认证授权。

## 14. 安全响应 Header

Web 边缘可统一添加基础 Header，但应用需要理解其影响：

- HSTS：强制后续 HTTPS；`includeSubDomains`/preload 上线前确认所有子域支持。
- CSP：限制脚本、样式、连接来源，先 Report-Only 观察。
- `X-Content-Type-Options: nosniff`：禁止 MIME 猜测。
- `Referrer-Policy`：控制跨站 Referer 泄露。
- `Permissions-Policy`：限制摄像头、定位等浏览器能力。
- Frame 限制：CSP `frame-ancestors` 防点击劫持。

## 15. 协议指标与排障

监控 TLS 版本/密码套件、握手成功和时延、证书剩余时间、会话恢复率、HTTP 协议分布、每连接请求数、h2 stream/reset、QUIC 回退、WebSocket 活跃连接/重连和 gRPC 状态。

排障工具示例：

```bash
# 查看 TLS 证书链、SNI 和协商信息
openssl s_client -connect api.example.com:443 -servername api.example.com -showcerts

# 查看 HTTP 版本、Header 和连接过程
curl -v --http2 https://api.example.com/health

# 强制解析域名到指定 IP，验证某个边缘/源站
curl -v --resolve api.example.com:443:203.0.113.10 https://api.example.com/health
```

`--resolve` 仅用于受控诊断，不能成为客户端绕过 DNS/CDN 的生产配置。

## 16. 上线检查清单

- [ ] TLS 终止、再加密和内部 mTLS 边界有明确威胁模型。
- [ ] 仅启用受支持的 TLS 1.2/1.3 与安全密码套件。
- [ ] 证书自动续期、完整链、私钥保护和多窗口告警已验证。
- [ ] SNI、Host、ALPN 和未知虚拟主机行为明确。
- [ ] h1/h2/h3 的回退、限额和协议级攻击补丁已验证。
- [ ] 写操作不接受可重放的 0-RTT 语义。
- [ ] gRPC deadline、流式背压和负载均衡正确。
- [ ] WebSocket/SSE 心跳、空闲超时、重连和游标恢复一致。
- [ ] 上传/下载/流式路由的大小、缓冲和超时单独配置。
- [ ] CORS、HSTS、CSP 等安全 Header 经过真实浏览器测试。

下一篇：[可靠性、容量与多地域](/architecture/edge/resilience)。
