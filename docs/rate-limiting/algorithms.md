# 02 · 核心算法

::: tip 状态
框架已搭建，正文待补充。本章是整个专题的核心。
:::

## 计划内容

- [ ] 固定窗口计数器：原理、实现、临界点双倍流量问题
- [ ] 滑动窗口：子窗口统计、Sentinel LeapArray 实现思路
- [ ] 漏桶：恒定速率流出、流量整形、为什么无法应对突发
- [ ] 令牌桶：可控突发、Guava RateLimiter（SmoothBursty / SmoothWarmingUp）
- [ ] 并发控制（Semaphore）与速率限流的互补
- [ ] GCRA：Redis-Cell 底层原理
- [ ] 四大算法横向对比：突发处理、平滑度、内存开销、实现复杂度
