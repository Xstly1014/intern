# 08 · 实践与代码

本章是动手清单：四个实践项目，从单机算法到分布式实现，再到框架接入和完整方案设计。每个项目给出可运行的代码与验证方法。

## 实践一：手写四大算法 + 单元测试验证

算法实现见 [02 核心算法](/rate-limiting/algorithms)，这里给出**验证要点**——写算法容易，验证边界才见功力。

### 1. 固定窗口：验证临界突刺

```java
@Test
void fixedWindow_criticalBurst() throws InterruptedException {
    FixedWindowLimiter limiter = new FixedWindowLimiter(100, 1000); // 100次/秒
    Thread.sleep(950);                  // 先等到窗口末尾
    for (int i = 0; i < 100; i++)
        assertTrue(limiter.tryAcquire());   // 旧窗口打满 100
    Thread.sleep(100);                  // 跨入新窗口
    for (int i = 0; i < 100; i++)
        assertTrue(limiter.tryAcquire());   // 新窗口又能打满 100
    // 200ms 内通过了 200 个请求 —— 临界突刺得证
}
```

### 2. 令牌桶：验证突发能力

```java
@Test
void tokenBucket_allowsBurst() throws InterruptedException {
    TokenBucketLimiter limiter = new TokenBucketLimiter(10, 50); // 10个/秒，桶容50
    Thread.sleep(5000);                   // 静置 5 秒攒满令牌
    int passed = 0;
    for (int i = 0; i < 60; i++)
        if (limiter.tryAcquire()) passed++;
    assertEquals(50, passed);             // 瞬间放行 50 个（桶容量），证明允许突发
}
```

### 3. 漏桶：验证匀速

```java
@Test
void leakyBucket_constantRate() throws InterruptedException {
    LeakyBucketLimiter limiter = new LeakyBucketLimiter(100, 10); // 漏速10个/秒
    ExecutorService pool = Executors.newFixedThreadPool(20);
    AtomicInteger passed = new AtomicInteger();
    for (int i = 0; i < 200; i++)
        pool.submit(() -> { if (limiter.tryAcquire()) passed.incrementAndGet(); });
    Thread.sleep(1000);
    assertTrue(passed.get() <= 12);       // 1 秒内放行不超过漏速 + 少量误差
}
```

## 实践二：Redis + Lua 分布式限流

Lua 脚本见 [03 分布式限流](/rate-limiting/distributed)，这里给出 Java 调用与压测验证。

### 1. Java 调用封装

```java
@Component
public class RedisRateLimiter {

    private final StringRedisTemplate redis;
    private final DefaultRedisScript<Long> script;

    public RedisRateLimiter(StringRedisTemplate redis) {
        this.redis = redis;
        this.script = new DefaultRedisScript<>();
        script.setLocation(new ClassPathResource("lua/sliding_window.lua"));
        script.setResultType(Long.class);
    }

    /** @return true=放行 */
    public boolean isAllowed(String key, int limit, long windowMs) {
        Long allowed = redis.execute(script,
                List.of("rl:" + key),
                String.valueOf(limit),
                String.valueOf(windowMs),
                String.valueOf(System.currentTimeMillis()));
        return allowed != null && allowed == 1L;
    }
}
```

### 2. 压测验证精度

用多线程模拟并发请求，统计实际放行数与阈值的偏差：

```java
@Test
void redisLimiter_precision() throws InterruptedException {
    ExecutorService pool = Executors.newFixedThreadPool(50);
    AtomicInteger passed = new AtomicInteger();
    CountDownLatch latch = new CountDownLatch(500);
    for (int i = 0; i < 500; i++) {
        pool.submit(() -> {
            if (limiter.isAllowed("test-key", 100, 1000)) passed.incrementAndGet();
            latch.countDown();
        });
    }
    latch.await();
    assertEquals(100, passed.get());   // Lua 原子性保证：精确放行 100 个
}
```

::: tip 验证目标
单机限流器在高并发下可能因竞态多放几个请求；Redis + Lua 方案应做到**精确等于阈值**，这是集中式计数的核心价值。
:::

## 实践三：接入 Sentinel + JMeter 压测

### 1. 接入

```xml
<dependency>
    <groupId>com.alibaba.csp</groupId>
    <artifactId>sentinel-core</artifactId>
    <version>1.8.8</version>
</dependency>
```

```java
@RestController
public class OrderController {

    @GetMapping("/order")
    @SentinelResource(value = "createOrder", blockHandler = "onBlock")
    public String createOrder() {
        return "ok";
    }

    public String onBlock(BlockException ex) {
        return "系统繁忙，请稍后再试";
    }
}
```

```java
// 启动时加载规则：createOrder 接口 200 QPS
@PostConstruct
public void initRules() {
    FlowRule rule = new FlowRule("createOrder", 200);
    FlowRuleManager.loadRules(List.of(rule));
}
```

### 2. JMeter / wrk 压测观察

```bash
# wrk：50 并发压 30 秒
wrk -t4 -c50 -d30s http://localhost:8080/order
```

观察指标：

| 指标 | 预期 |
|---|---|
| 实际 QPS | 稳定在 200 左右，不随并发数上升 |
| 被拒响应 | 返回 blockHandler 的兜底文案 |
| RT | 限流后 RT 应保持平稳，不随压力上涨 |

## 实践四：为一个真实 API 设计完整方案

综合演练：为"商品详情接口"设计限流方案，输出一份设计文档，覆盖以下要素：

| 要素 | 示例答案 |
|---|---|
| 限流维度 | 全局 QPS + 单用户 QPS + 热点商品 ID |
| 算法选择 | 全局用令牌桶（容忍突发），单用户用滑动窗口（精确） |
| 阈值依据 | 压测单机 2000 QPS × 10 台 × 0.8 × 0.75 ≈ 12000 |
| 部署位置 | 网关限全局，应用层限用户与热点维度 |
| 拒绝响应 | 429 + Retry-After + 友好文案 |
| 降级预案 | Redis 故障时切换本地限流兜底 |
| 监控告警 | 拒绝率 > 1% 告警，接近阈值 80% 预警 |

## 验证清单

完成以上实践后，应能回答：

- [ ] 固定窗口的临界突刺是怎么产生的？滑动窗口如何解决？
- [ ] 令牌桶为什么能容忍突发？桶容量该设多大？
- [ ] 为什么分布式限流必须用 Lua（或事务）？直接用 INCR 行不行？
- [ ] Sentinel 的滑动窗口统计（LeapArray）和 Redis ZSET 方案有什么异同？
- [ ] 限流触发后，如何从监控数据判断阈值是定高了还是定低了？
