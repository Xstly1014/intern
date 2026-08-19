# 限流

限流（Rate Limiting）是高可用系统的"保险丝"：通过控制请求速率，让系统在突发流量与恶意刷量下，依然能响应真正的请求。

本专题涵盖 8 大模块，按照 **为什么限 → 怎么限 → 分布式下怎么限 → 配套治理手段 → 用什么限 → 怎么落地** 的主线组织。

::: tip 当前状态
初版已完成：8 大模块全部上线，后续将持续补充图解与更多实战案例。
:::

## 目录总览

### 01 基础概念

- [什么是限流](/rate-limiting/basics) · 限什么、为什么限、在哪限 · 与熔断、降级、并发控制的边界

### 02 核心算法

- [四大限流算法实现](/rate-limiting/algorithms) · 固定窗口 · 滑动窗口 · 漏桶 · 令牌桶 · 手写 Java 实现

### 03 分布式限流

- [Redis 实现方案](/rate-limiting/distributed) · INCR+EXPIRE · ZSET 滑动窗口 · Lua 令牌桶 · Redis-Cell / Redisson

### 04 熔断与降级

- [熔断状态机与降级策略](/rate-limiting/governance) · 什么时候熔断 / 怎么熔断 · 什么时候降级 / 怎么降级 · 组合方式

### 05 框架与组件

- [Sentinel 与组件选型](/rate-limiting/frameworks) · Sentinel 核心能力 · 与 Hystrix、Resilience4j 对比

### 06 工程落地

- [生产环境落地](/rate-limiting/engineering) · 多级防线 · 阈值设定 · 429 响应设计 · 配额系统 · 监控告警

### 07 进阶专题

- [更智能的限流](/rate-limiting/advanced) · 自适应限流 · BBR · 全链路流控 · 大规模配额系统 · 面试速查

### 08 实践与代码

- [动手实践](/rate-limiting/practice) · 手写算法与单测 · Redis+Lua 验证 · Sentinel 压测 · 完整方案设计

## 学习主线

为什么限（基础概念）→ 怎么限（核心算法）→ 分布式下怎么限（分布式限流）→ 配套治理手段（熔断与降级）→ 用什么限（框架与组件）→ 怎么落地（工程落地）→ 怎么更智能（进阶专题）
