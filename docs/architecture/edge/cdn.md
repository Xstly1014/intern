# CDN 与边缘缓存：加速、回源与缓存正确性

CDN（Content Delivery Network）把内容复制到离用户更近的 PoP（Point of Presence），减少网络 RTT、跨境/跨运营商链路和源站带宽。它同时也是一层分布式缓存：能显著提升性能，也能把一次错误配置复制到全球。

CDN 设计的核心不是“缓存多久”，而是回答五个问题：**缓存什么、用什么键区分、何时过期、如何回源、出错后怎样恢复。**

## 1. 请求流程

![CDN 缓存命中、过期验证与回源流程](/architecture/cdn-cache-flow.svg)

大型 CDN 可能有边缘层、区域中间层（Origin Shield）和源站多级结构。Origin Shield 将大量 PoP 的回源合并到少量中间节点，降低源站连接数和缓存击穿。

## 2. 哪些内容适合缓存

| 内容 | 缓存建议 | 原因 |
|---|---|---|
| 内容哈希 JS/CSS/字体 | 长 TTL + immutable | URL 随内容变化，可永久视为不可变 |
| 商品图片、视频切片 | 长 TTL | 公开且复用率高 |
| 公共商品详情 GET | 短 TTL/边缘计算 | 需评估价格、库存陈旧窗口 |
| 首页 HTML | 短 TTL + stale 策略 | 更新频繁但可短时陈旧 |
| 登录后个人页面 | 默认 private/no-store | 极易串用户和泄露隐私 |
| POST/支付/订单写入 | 不缓存 | 有副作用且响应个性化 |
| 404/5xx | 谨慎短缓存或不缓存 | 错误缓存可能放大事故 |

只有同时满足“响应可由多个用户复用、允许在一定时间内陈旧、缓存键能完整表达差异”时才适合共享缓存。

## 3. HTTP 缓存语义

### Cache-Control

| 指令 | 含义 |
|---|---|
| `max-age=60` | 浏览器等私有缓存可新鲜使用 60 秒 |
| `s-maxage=300` | CDN 等共享缓存使用 300 秒，覆盖 max-age |
| `public` | 明确允许共享缓存（仍需避免敏感数据） |
| `private` | 只能私有缓存，不应进共享 CDN 缓存 |
| `no-cache` | 可以存，但每次使用前必须向源站验证 |
| `no-store` | 不应保存请求或响应 |
| `immutable` | 新鲜期内内容不会变化，客户端无需重新验证 |
| `stale-while-revalidate=30` | 过期后 30 秒可返回旧内容并后台更新 |
| `stale-if-error=300` | 源站错误时最多 300 秒返回旧内容 |

`no-cache` 不是“不缓存”，这是最常见误解。敏感响应通常使用 `private, no-store`。

### 条件请求

源站可返回 `ETag` 或 `Last-Modified`。缓存过期后携带 `If-None-Match`/`If-Modified-Since`，内容未变时源站返回 304，节省响应体传输。

强 ETag 表示字节完全一致；弱 ETag（`W/`）表示语义等价。若 CDN 会自动压缩或转换图片，应明确 ETag 是针对原始内容还是具体编码版本。

## 4. 缓存键是正确性的核心

默认缓存键通常包含 Scheme、Host、Path 和 Query，但供应商规则不同。可能影响响应的维度必须进入缓存键或禁止共享缓存：

- 查询参数：`?page=2&sort=price`。
- 内容编码：gzip、br，通过 `Vary: Accept-Encoding`。
- 图片格式：WebP/AVIF，通过协商或改写后的内部键。
- 语言：`Accept-Language` 或明确 `/zh-CN/` 路径。
- 设备/实验组：尽量转为有限枚举，避免缓存碎片。
- 身份和 Cookie：通常意味着不应共享缓存，而不是把完整 Cookie 放进键。

### Query 参数治理

跟踪参数如 `utm_source` 不应制造不同缓存对象；业务参数必须保留。采用参数白名单和规范化排序：

```text
/products?id=10&utm_source=x
/products?utm_source=y&id=10
→ 统一缓存键 /products?id=10
```

不能粗暴忽略所有 Query，否则 `/product?id=10` 与 `id=11` 可能串内容。

### Vary 风险

`Vary: *` 几乎让共享缓存失效；`Vary: User-Agent` 会产生海量碎片。尽量使用少量稳定维度，或在边缘把 User-Agent 归一化成 mobile/desktop 等有限类别。

## 5. 缓存模式

### 内容寻址与版本化 URL

```text
app.js          不推荐长期缓存：内容变但 URL 不变
app.a83f1.js    推荐：内容变化产生新 URL
```

HTML 短缓存并引用带哈希静态资源。回滚只需要让 HTML 指回旧哈希，旧资源仍在 CDN。不要发布新 HTML 后立刻删除旧资源，因为仍有旧页面和旧 App 引用它。

### TTL 过期

简单，但会有最大 TTL 的陈旧窗口。适合允许短时不一致的内容。

### 主动 Purge/Invalidate

内容变化后调用 CDN API 清除。Purge 通常异步传播、有配额且可能失败，不能当作原子事务。优先 purge URL/Tag，避免全站清缓存造成回源洪峰。

### Surrogate Key/Cache Tag

给响应标记 `product-10`，商品变化时清除所有关联 URL。适合一个实体出现在列表、详情和推荐等多个页面，但需要维护标签关系。

## 6. 缓存击穿、穿透和雪崩

### 热 Key 击穿

热门对象刚过期，大量 PoP/请求同时回源。措施：请求合并（single flight）、TTL 抖动、预热、stale-while-revalidate、Origin Shield。

### 缓存穿透

恶意或随机不存在 URL 每次回源。措施：规范化路径、WAF/Bot 限制、短暂负缓存 404、签名 URL、应用层布隆过滤器。负缓存时间要短，避免新资源创建后仍不可见。

### 缓存雪崩

大量对象同时到期或全站 purge，源站瞬时被打满。措施：TTL 随机化、分批失效、源站回源限流、容量预留和降级旧内容。

## 7. 回源设计

### 隐藏和保护源站

源站应只接受 CDN/WAF 的受信地址或 mTLS/签名回源，避免攻击者绕过边缘直接打源站。不要只依赖公开的 CDN IP 白名单而没有自动更新和验证。

### 回源 Host 与 SNI

CDN 访问源站时 HTTP Host、TLS SNI 和证书域名必须匹配。用户域名可能是 `static.example.com`，实际源站是 `origin.internal.example.com`，要明确重写规则。

### 回源超时与重试

连接超时短、响应超时按内容类型区分。CDN 对 GET 可有限重试健康源站；对 POST 默认不应重试。大对象使用 Range 请求和分片缓存，源站支持正确的 `206 Partial Content`。

### Origin Shield

Shield 的地域要靠近源站并具备足够带宽。如果 Shield 单点故障，应能旁路或切换。监控边缘命中率之外，还要看 Shield 命中率和最终源站请求率。

## 8. 动态加速与边缘计算

即使动态 API 不缓存，CDN 也可通过长连接复用、智能路由、TLS 就近终止和网络优化降低延迟。边缘函数可做 URL 规范化、轻量鉴权、A/B 标记、图片变换和 Header 操作。

但边缘函数有严格边界：

- 运行时、CPU、内存、Body 大小和执行时间有限。
- 全球部署与日志调试比中心服务复杂。
- 不适合核心业务状态机、数据库事务和高敏 Secret。
- 逻辑必须版本化、灰度和快速回滚。

## 9. 压缩、图片与大文件

### 文本压缩

Brotli 常用于 HTTPS 静态文本，gzip 兼容更广。小响应压缩收益有限，动态高压缩级别可能浪费 CPU。确保 `Vary: Accept-Encoding`，避免把 br 响应发给不支持的客户端。

### 图片优化

根据显示尺寸生成不同规格，协商 WebP/AVIF，保留原图或高质量母版。转换结果进入独立缓存键。用户上传图片先扫描、去除危险元数据，再发布到公开分发域名；上传域与展示域分离可降低同源风险。

### 下载与视频

支持 Range、断点续传、分片、带宽限速和签名 URL。签名包含资源、过期时间和必要范围，不把永久凭证放 URL。视频采用 HLS/DASH 多码率，边缘缓存切片。

## 10. 缓存安全问题

### Cache Poisoning

攻击者利用未进入缓存键、却影响源站响应的 Header 让恶意响应被共享缓存。入口应只允许明确 Header，源站避免反射任意 Host/转发头，缓存键与 `Vary` 保持一致。

### Cache Deception

攻击者诱导用户访问看似静态后缀的个性化 URL，CDN 将敏感响应缓存。缓存规则按响应语义和明确路径配置，不应仅看到 `.css`/`.jpg` 后缀就缓存；认证响应默认禁止共享缓存。

### Signed URL/Cookie

用于私有下载和视频授权。签名校验后是否共享缓存要谨慎：可以缓存加密/相同内容，但授权必须每次在边缘验证，缓存键不能因每个签名都碎片化。

## 11. 指标体系

| 指标 | 说明 |
|---|---|
| Request Hit Ratio | 命中请求占比，受小文件影响大 |
| Byte Hit Ratio | 命中字节占比，更能体现带宽节省 |
| Origin Request Rate | 最终到源站的请求率 |
| Origin Bandwidth | 回源带宽和峰值 |
| TTFB by PoP/Region | 各边缘节点首字节延迟 |
| Cache Status | HIT/MISS/STALE/BYPASS/EXPIRED 分布 |
| Purge Latency/Failure | 失效传播耗时与失败 |
| 4xx/5xx by Edge/Origin | 区分边缘生成与源站返回的错误 |

命中率要按 Host、Path 类别、状态码和地域拆分。总体 95% 可能掩盖最昂贵的大文件命中率很低。

## 12. 排障顺序

1. 查看响应 `Age`、`Via`、供应商 Cache-Status/Header，判断是否命中。
2. 对比带 CDN 请求和直连受控源站请求，但不要公开绕过安全入口。
3. 检查缓存键涉及的 Query、Cookie、Host、Accept-Encoding 等。
4. 检查源站实际返回的 Cache-Control、Vary、ETag 和状态码。
5. 从多个地域/PoP 验证，判断是局部节点还是全局配置。
6. 查最近规则、Purge、证书、源站和发布变更。
7. 修复后使用版本化 URL或精确失效，避免全站 purge。

## 13. 上线检查清单

- [ ] 列出每类路径的缓存/不缓存规则和内容所有者。
- [ ] 缓存键明确处理 Host、Query、编码、语言和 Cookie。
- [ ] 登录态、租户态、敏感响应默认为 private/no-store。
- [ ] 静态资源使用内容哈希、长 TTL、immutable，并保留旧版本。
- [ ] 404/重定向/5xx 的缓存策略明确且经过测试。
- [ ] 有请求合并、TTL 抖动、Shield 和源站过载保护。
- [ ] 回源鉴权、Host、SNI、超时、重试与多源策略正确。
- [ ] Purge 有范围、配额、审计、失败重试和全站清除保护。
- [ ] Cache Poisoning/Deception 测试通过。
- [ ] 命中率、回源、TTFB、错误和失效延迟可观测。

下一篇：[DDoS、WAF 与 Bot 防护](/architecture/edge/security)。
