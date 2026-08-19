# 06 · 工程落地

算法只是工具，真正的难点在于：**限在哪、阈值定多少、被限流后怎么响应、怎么动态调整**。本章按一次完整的落地流程展开：选位置 → 定阈值 → 设计响应 → 配额管理 → 动态配置 → 监控闭环。

## 一、限流位置：多级防线

限流不是"选一个地方放个限流器"，而是**多层防线、各司其职**：

```
用户 → CDN/边缘(抗D、防刷) → 网关(全局粗粒度) → 应用(接口/用户细粒度) → 资源层(DB连接池、线程池)
```

| 层级 | 典型手段 | 限什么 | 特点 |
|---|---|---|---|
| CDN / 边缘 | 频次封禁、WAF 规则 | 恶意 IP、爬虫 | 流量最靠前，成本最低 |
| 网关 | Nginx `limit_req`、API 网关插件 | 全局 QPS、IP、API Key | 统一入口，粗粒度兜底 |
| 应用层 | Sentinel、Resilience4j | 接口、用户、热点参数 | 粒度最细，懂业务语义 |
| 资源层 | 连接池、线程池、信号量 | 并发数 | 保护最后一道资源 |

**原则：越靠前拦截，成本越低；越靠后，粒度越细。** 生产上通常是"网关粗限 + 应用细限"组合：网关挡住 80% 的异常流量，应用层做业务维度的精细控制。

::: warning 常见误区
只在网关限流。网关不知道"这个用户今天已经下了 100 单"这类业务语义，细粒度控制必须下沉到应用层。
:::

## 二、阈值设定：从压测到水位线

### 1. 容量评估三步走

1. **压测摸底**：用 JMeter / wrk 对核心接口压测，得到单机极限 QPS（如 2000 QPS @ RT p99 < 200ms）。
2. **折算集群容量**：`集群容量 = 单机极限 × 实例数 × 折扣系数(0.7~0.8)`，折扣留给 GC、抖动和故障转移。
3. **设定水位线**：限流阈值取容量的 **70%~80%**，剩余空间应对突发与扩容前的空窗。

```
单机极限 2000 QPS × 10 台 × 0.8(折扣) = 16000 QPS(集群容量)
限流阈值 = 16000 × 0.75 ≈ 12000 QPS
```

### 2. 分级阈值

不同接口的重要性不同，阈值也应分级：

| 级别 | 示例 | 策略 |
|---|---|---|
| 核心 | 下单、支付 | 高阈值，优先保活，绝不轻易限流 |
| 重要 | 商品详情、搜索 | 正常阈值 |
| 非核心 | 推荐、评论、积分 | 低阈值，压力大时优先牺牲 |

### 3. 动态调整

阈值不能写死在代码里。接入配置中心（Nacos / Apollo），支持：

- 大促前一键上调阈值
- 故障时一键收紧阈值（保护模式）
- 调整后实时生效，无需重启

## 三、被限流后的响应设计

### 1. HTTP 标准响应

被限流时应返回 **429 Too Many Requests**，并携带标准头：

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 2
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1735660800
Content-Type: application/json

{
  "code": 429,
  "message": "请求过于频繁，请稍后再试"
}
```

| 响应头 | 含义 |
|---|---|
| `Retry-After` | 建议客户端多少秒后重试 |
| `X-RateLimit-Limit` | 窗口内允许的总配额 |
| `X-RateLimit-Remaining` | 当前窗口剩余配额 |
| `X-RateLimit-Reset` | 配额重置的时间戳 |

### 2. Spring Boot 示例

```java
@RestControllerAdvice
public class RateLimitExceptionHandler {

    @ExceptionHandler(BlockException.class)
    public ResponseEntity<Map<String, Object>> onBlock(BlockException ex) {
        Map<String, Object> body = Map.of(
                "code", 429,
                "message", "请求过于频繁，请稍后再试");
        return ResponseEntity.status(429)
                .header("Retry-After", "2")
                .header("X-RateLimit-Limit", "100")
                .header("X-RateLimit-Remaining", "0")
                .body(body);
    }
}
```

::: tip 面向用户的文案
对 C 端用户，文案要友好（"当前人数较多，请稍后再试"）；对开放平台 API，要返回结构化错误码，方便调用方程序化处理。
:::

### 3. 客户端配合：指数退避 + 抖动

客户端收到 429 后不应立即重试（会加剧拥塞），标准做法是**指数退避 + 随机抖动**：

```java
int attempt = 0;
while (attempt < maxRetry) {
    Response resp = client.execute(request);
    if (resp.status() != 429) return resp;
    // 退避时间：base * 2^attempt + 随机抖动
    long backoff = (long) (baseMs * Math.pow(2, attempt)
            + ThreadLocalRandom.current().nextLong(100));
    Thread.sleep(backoff);
    attempt++;
}
```

抖动（jitter）是关键：如果 1000 个客户端都在第 2 秒整点重试，会形成二次洪峰；加随机抖动可把重试打散。

## 四、配额系统：开放平台的限流

面向开发者的开放平台，限流升级为**配额管理**：

| 维度 | 说明 |
|---|---|
| API Key 配额 | 每个 Key 每天 10 万次调用 |
| 分级套餐 | 免费版 100 QPS / 专业版 1000 QPS |
| 接口级配额 | 敏感接口（如短信发送）单独低配额 |
| 计费联动 | 超配额后可付费扩容 |

典型实现：Redis 记录 `quota:{apiKey}:{date}` 计数，网关每次请求扣减，配合 Lua 保证原子性。配额与限流的区别在于：**限流管速率（QPS），配额管总量（每天 N 次）**，两者常组合使用。

## 五、热点限流

全局阈值挡不住"单点打爆"：总 QPS 没超限，但某个爆款商品被 10 万请求集中访问，依然会打挂对应缓存和数据库。

**热点参数限流**按参数值分别计数：

```java
// Sentinel 热点参数限流：对 skuId 参数限流
ParamFlowRule rule = new ParamFlowRule("queryItem")
        .setParamIdx(0)          // 第 0 个参数
        .setCount(100)           // 单个参数值 100 QPS
        .setGrade(RuleConstant.FLOW_GRADE_QPS);
ParamFlowRuleManager.loadRules(Collections.singletonList(rule));
```

配合**参数例外项**：对已知的爆款商品单独配置更严格或更宽松的阈值。

## 六、监控与告警闭环

限流不是配完就结束，必须形成 **压测 → 设阈值 → 监控 → 调整** 的闭环：

| 指标 | 说明 | 告警条件示例 |
|---|---|---|
| 通过 QPS | 实际放行的请求量 | 接近阈值 80% 时预警 |
| 拒绝 QPS / 拒绝率 | 被限流的请求量 | 拒绝率 > 1% 告警 |
| RT（p99） | 响应时间 | 限流后 RT 仍上涨说明瓶颈在别处 |
| 系统负载 | CPU / Load / 线程数 | 与限流动作联动分析 |

关键判断：

- **拒绝率高但系统很闲** → 阈值定低了，误伤正常流量，上调。
- **拒绝率低但系统快崩** → 阈值定高了或瓶颈不在 QPS（可能是慢 SQL、连接池），先查瓶颈。
- **限流触发后 RT 下降** → 限流生效，保护成功。

## 本章小结

工程落地的核心是四句话：**多层防线各管一段，阈值来自压测而非拍脑袋，429 响应要让客户端能程序化处理，监控数据驱动阈值持续调整。**
