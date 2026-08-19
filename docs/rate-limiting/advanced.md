# 07 · 进阶专题

静态阈值是限流的起点，但不是终点。本章讨论四个进阶方向：**自适应限流**（让系统自己找阈值）、**全链路流控**（从单点到全局）、**大规模配额系统**（开放平台架构）、**云原生与安全视角**。

## 一、自适应限流：让系统自己找阈值

### 1. 静态阈值的困境

压测得出的阈值只在"压测环境"成立：机器规格变了、依赖变慢了、流量结构变了，阈值就失真了。自适应限流的目标是**根据系统实时负载动态调整准入量**。

### 2. 基于负载的简单自适应

最直观的思路：盯着 CPU / Load / RT，超线就收紧。

```java
// Sentinel 系统自适应保护规则
SystemRule rule = new SystemRule();
rule.setHighestSystemLoad(10);   // Load 上限
rule.setHighestCpuUsage(0.8);    // CPU 使用率上限
rule.setAvgRt(500);              // 平均 RT 上限
rule.setMaxThread(200);          // 并发线程上限
SystemRuleManager.loadRules(Collections.singletonList(rule));
```

Sentinel 的系统规则借鉴了 TCP BBR 的思想，核心公式是 Little's Law：

```
最大吞吐 = 并发数 / RT
```

当系统 RT 上升时，能承载的并发数就应该相应下降，否则排队会越积越多。

### 3. BBR 思想

TCP BBR 拥塞控制的核心洞察：**网络（和服务器）都有一个"最大处理能力"，超过这个能力的请求不会增加吞吐，只会增加排队延迟。**

BBR 的做法：

1. 持续探测系统的最大带宽（MaxBW）和最小 RT（MinRT）。
2. 把在途请求量控制在 `MaxBW × MinRT` 附近——刚好填满处理能力，不多不少。
3. 多出来的请求直接拒绝，而不是让它们排队拖慢所有人。

对应到限流：**不是限制"每秒进多少"，而是限制"系统里同时有多少在处理的请求"**，让吞吐最大化同时 RT 不劣化。

### 4. Netflix concurrency-limits

Netflix 开源的 concurrency-limits 库把 BBR 思想工程化：

```java
// 基于梯度算法的并发限制器
ConcurrencyLimiter limiter = Gradient2Limit.newBuilder()
        .build();

Limiter.Listener listener = limiter.acquire()   // 尝试获取许可
        .orElseThrow(() -> new RateLimitException());
try {
    Response resp = doRequest();
    listener.onSuccess(resp.getLatencyMs());    // 反馈延迟，动态调整上限
} catch (Exception e) {
    listener.onIgnore();
}
```

它不需要预设阈值，通过每次请求的延迟反馈**自动收敛到最优并发数**：延迟上升说明过载，自动下调；延迟平稳则逐步上调。

### 5. AIMD（加性增、乘性减）

自适应调整的通用策略：

- **加性增**：没出问题时，每轮把阈值 +1（谨慎试探）。
- **乘性减**：一出问题，立刻把阈值 ×0.5（快速撤退）。

TCP 拥塞控制用的就是 AIMD，限流场景同样适用：**涨要慢，跌要快。**

## 二、限流与服务治理：全链路流控

### 1. 单点限流的局限

入口限住了 1 万 QPS，但这 1 万请求扇出到下游可能是 5 万次调用（一个订单页要调商品、库存、优惠、评论 5 个服务）。**入口限流保护不了下游的放大效应。**

### 2. 全链路流量控制

全链路流控的思路：

1. **流量打标**：入口给请求打上来源标签（如 `source=app`、`source=h5`）。
2. **链路透传**：标签沿调用链传递（RPC 上下文 / HTTP Header）。
3. **按来源限流**：每个服务对"来源 × 接口"分别限流，防止某个调用方打爆下游。

```java
// Sentinel 按调用来源限流
FlowRule rule = new FlowRule("queryStock")
        .setCount(500)
        .setLimitApp("order-service");   // 只限制来自 order-service 的调用
```

4. **链路级联保护**：上游被限流时，下游感知到并同步收缩，避免无效调用。

### 3. 与熔断降级的联动

完整的治理组合拳（详见 [04 熔断与降级](/rate-limiting/governance)）：

```
流量进来 → 限流(准入控制) → 调用下游 → 熔断(故障隔离) → 降级(兜底返回)
```

## 三、大规模分布式配额系统设计

开放平台场景（每天数十亿次调用、百万级 API Key），单机 Redis Lua 方案会遇到瓶颈，需要专门的配额系统架构：

| 挑战 | 解法 |
|---|---|
| Redis 单点 QPS 不够 | 按 Key 分片到多个 Redis 实例 |
| 每次请求都访问 Redis 太贵 | 本地缓存配额，批量扣减（如一次扣 100 个） |
| 本地缓存与中心不一致 | 定时对账 + 租约（lease）机制 |
| Redis 故障 | 降级为本地限流兜底，宁松勿死 |

**批量扣减 + 本地缓存**是核心优化：

```
应用实例启动时向配额中心"批发" 1000 次额度
本地每来一个请求扣 1，扣完再去批发
配额中心只承受 1/1000 的调用量
```

代价是精度下降（实例崩溃会浪费剩余额度），通过缩短租约时间和对账来平衡。

## 四、云原生限流

| 场景 | 方案 |
|---|---|
| Kubernetes Ingress | Nginx Ingress 的 `nginx.ingress.kubernetes.io/limit-rps` 注解 |
| Service Mesh | Istio EnvoyFilter 配置 `envoy.filters.http.local_ratelimit`，或全局限流服务 |
| API 网关层 | Kong / APISIX 的 rate-limiting 插件，规则存于 etcd / Redis |
| Serverless | 云厂商自带并发配额（如 Lambda 并发数限制），重点防止并发打爆下游 |

Service Mesh 的优势在于**限流对业务代码零侵入**：规则下发到 Sidecar，升级、调整都不需要改代码发版。

## 五、安全视角：限流是风控的一环

限流与安全的交叉地带：

- **黑白名单**：白名单直通（压测流量、内部服务），黑名单直接拒绝（恶意 IP、异常设备指纹）。
- **反爬**：对 User-Agent、访问路径模式异常的来源动态降速，比直接封禁更温和。
- **防刷**：短信验证码、领券、下单接口必须叠加"用户维度 + 设备维度 + IP 维度"三重限流。
- **风控联动**：风控系统识别出可疑用户后，实时下发"对该用户收紧限流"的规则。

::: warning 安全限流的特殊性
安全场景的限流阈值往往不是容量问题，而是业务容忍度问题（一个用户 1 分钟领 10 张券正常，领 100 张就是羊毛党）。这类规则应由风控策略驱动，而非容量评估。
:::

## 六、面试高频点速查

| 问题 | 答题要点 |
|---|---|
| 手写令牌桶 | 懒计算补令牌：`tokens = min(capacity, tokens + Δt × rate)` |
| 为什么用 Redis + Lua | 读-改-写必须原子，Lua 在 Redis 单线程内执行天然原子 |
| 滑动窗口 vs 固定窗口 | 滑动窗口解决临界突刺：两个窗口交界处各打满，瞬时流量可达阈值 2 倍 |
| Sentinel 滑动窗口原理 | LeapArray：把 1 秒切成多个 WindowWrap，环形数组复用，统计时聚合未过期窗口 |
| 令牌桶 vs 漏桶 | 令牌桶允许突发（攒令牌），漏桶强制匀速；对外 API 多用令牌桶 |
| 分布式限流怎么保证精度 | 接受"近似精确"：Redis 集中计数 + 本地缓存批量扣减，用对账兜底 |
| 限流后返回什么 | 429 + Retry-After + X-RateLimit-* 头，客户端指数退避 + 抖动 |

## 本章小结

进阶限流的本质是三个转变：**从静态阈值到动态自适应，从单点防护到全链路流控，从容量工具到安全风控的一环。**
