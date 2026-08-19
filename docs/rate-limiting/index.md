# 限流

限流（Rate Limiting）是高可用系统的"保险丝"：通过控制请求速率，让系统在突发流量与恶意刷量下，依然能响应真正的请求。

本专题涵盖 7 大模块，按照 **为什么限 → 怎么限 → 分布式下怎么限 → 用什么限 → 怎么落地 → 怎么更智能** 的主线组织。

::: tip 当前状态
目录框架已搭建，各章节正文将陆续补充。
:::

## 目录总览

### 01 基础概念

- [为什么需要限流](/rate-limiting/basics) · 限流维度 · 限流位置 · 与熔断降级的关系

### 02 核心算法

- [四大限流算法](/rate-limiting/algorithms) · 固定窗口 · 滑动窗口 · 漏桶 · 令牌桶 · GCRA

### 03 分布式限流

- [集群级限流](/rate-limiting/distributed) · Redis+Lua · 分布式令牌桶 · 两级限流 · 一致性与可用性

### 04 框架与组件

- [用什么限流](/rate-limiting/frameworks) · Guava RateLimiter · Sentinel · Nginx · API 网关

### 05 工程落地

- [生产环境落地](/rate-limiting/engineering) · 阈值设定 · 429 响应设计 · 配额系统 · 监控告警

### 06 进阶专题

- [更智能的限流](/rate-limiting/advanced) · 自适应限流 · BBR · 大规模配额系统 · 云原生限流

### 07 实践与代码

- [动手实践](/rate-limiting/practice) · 手写算法 · Redis+Lua 实现 · 压测验证
