# 02 · 核心算法

四种算法的实现共享同一个套路：**懒计算**——不需要后台线程，每次请求进来时先根据"距上次的时间差"更新状态，再做判断。区别只在更新的是什么状态：计数、窗口、水位还是令牌。

## 固定窗口计数器

**思路**：把时间切成固定长度的窗口，每个窗口维护一个计数器；请求来了先判断是否跨窗，跨窗就清零，然后计数并与阈值比较。

```java
public class FixedWindowLimiter {
    private final int limit;       // 阈值：每窗口最多放行多少
    private final long windowMs;   // 窗口大小（毫秒）
    private long windowStart;      // 当前窗口起点
    private int count;             // 当前窗口计数

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        if (now - windowStart >= windowMs) {        // 跨窗了
            windowStart = now - now % windowMs;     // 对齐到新窗口
            count = 0;                              // 计数清零
        }
        return ++count <= limit;                    // 计数并判断
    }
}
```

**致命缺陷是临界点问题**：阈值 100/分钟时，第 1 分钟的最后 1 秒来 100 个请求、第 2 分钟的第 1 秒又来 100 个，两个窗口各自都没超标，但实际 2 秒内通过了 200 个，瞬时流量远超阈值。

## 滑动窗口

**思路**：不再等窗口整体翻转，而是让窗口随时间连续滑动，滑出窗口的请求记录被逐出，统计的永远是"最近 N 毫秒内"的请求数。最直观的实现是存每个请求的时间戳：

```java
public class SlidingWindowLimiter {
    private final int limit;
    private final long windowMs;
    private final Deque<Long> timestamps = new ArrayDeque<>();

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        // 1. 逐出已滑出窗口的请求记录
        while (!timestamps.isEmpty() && now - timestamps.peekFirst() >= windowMs) {
            timestamps.pollFirst();
        }
        // 2. 窗口内数量未达阈值则放行并记录
        if (timestamps.size() < limit) {
            timestamps.offerLast(now);
            return true;
        }
        return false;
    }
}
```

**工程优化**：存每个时间戳内存开销大（O(请求数)），所以 Sentinel 的 LeapArray 把窗口切成若干子窗口，每个子窗口只存聚合计数，窗口滑动时丢弃最老的子窗口、复用其空间。用少量精度损失换内存和性能，这是面试常考的点。

## 漏桶

**思路**：请求像水滴进桶，桶以恒定速率漏水（处理）；桶满则新请求被拒绝。实现上不需要真的维护队列，只需记录"水位"和上次漏水时间，用时间差算出已漏掉的水量：

```java
public class LeakyBucketLimiter {
    private final double rate;      // 漏出速率（个/秒），恒定
    private final int capacity;     // 桶容量（能积压多少）
    private double water;           // 当前水位
    private long lastLeakMs = System.currentTimeMillis();

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        // 1. 先漏水：按时间差扣掉已处理的量
        double leaked = (now - lastLeakMs) / 1000.0 * rate;
        water = Math.max(0, water - leaked);
        lastLeakMs = now;
        // 2. 桶没满，这滴水才能进去
        if (water + 1 <= capacity) {
            water += 1;
            return true;
        }
        return false;               // 桶满，拒绝
    }
}
```

**特性**：无论进来多突发，出去永远是恒定速率，所以它是"流量整形"；代价是完全无法应对突发，桶满即拒。Nginx 的 `limit_req` 就是漏桶。

## 令牌桶

**思路**：和漏桶镜像对称——以恒定速率往桶里放令牌（不超过桶容量），请求来了取走一个令牌就放行，没令牌就拒绝。桶里攒的令牌就是"允许突发的额度"：

```java
public class TokenBucketLimiter {
    private final double rate;      // 放令牌速率（个/秒）
    private final double capacity;  // 桶容量（最多攒多少令牌）
    private double tokens;          // 当前令牌数
    private long lastRefillMs = System.currentTimeMillis();

    public synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        // 1. 先补令牌：按时间差补充，不超过桶容量
        double refill = (now - lastRefillMs) / 1000.0 * rate;
        tokens = Math.min(capacity, tokens + refill);
        lastRefillMs = now;
        // 2. 有令牌就取走放行
        if (tokens >= 1) {
            tokens -= 1;
            return true;
        }
        return false;               // 无令牌，拒绝
    }
}
```

**和漏桶的本质区别**：漏桶控制的是"出"（强制匀速），令牌桶控制的是"入"（攒了令牌就能一次性花掉），所以令牌桶允许可控突发。Guava 的 `RateLimiter`（SmoothBursty）就是令牌桶，且用的正是这种懒计算——没有定时线程放令牌，取的时候才按时间差结算。

## 四种实现对比

| 算法 | 维护的状态 | 核心操作 | 突发流量 | 典型实现 |
|---|---|---|---|---|
| 固定窗口 | 计数 + 窗口起点 | 跨窗清零，计数比较 | 临界点可能超 2 倍 | 简单计数器 |
| 滑动窗口 | 时间戳队列 / 子窗口数组 | 逐出过期，求和比较 | 较平滑 | Sentinel LeapArray |
| 漏桶 | 水位 + 上次漏水时间 | 先漏水，再加水 | 严格不允许 | Nginx limit_req |
| 令牌桶 | 令牌数 + 上次补充时间 | 先补令牌，再取用 | 允许可控突发 | Guava RateLimiter |

::: tip 一句话总结
四种算法的实现各是一句话——"跨窗清零"、"滑动逐出"、"先漏再加"、"先补再取"；它们都是懒计算，区别只在对突发的态度和内存的取舍。
:::

## 下一步

单机版在多实例部署下无法限制总量，把状态搬到 Redis 即可升级为分布式限流，见 [03 分布式限流](/rate-limiting/distributed)。
