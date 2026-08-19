# 05 · 框架与组件

## Sentinel：流量治理组件

Sentinel 是阿里巴巴开源的**流量治理组件**：它以"资源"（接口、方法、服务）为单位，提供流量控制、熔断降级、热点限流、系统自适应保护等能力，可以理解为微服务的"总闸 + 保险丝盒"。它诞生于阿里内部，经过多年双 11 大促的流量考验后开源。

工作方式：每个受保护的接口/方法被定义为一个"资源"，请求访问资源时依次经过规则校验，违反任何一条规则就被拦截（抛 `BlockException`），走兜底逻辑。

### 两个核心概念

- **资源（Resource）**：被保护的对象，可以是一个方法、一个 HTTP 接口、一段代码，用 `@SentinelResource` 注解或 API 手动定义
- **规则（Rule）**：作用在资源上的保护策略，包括流控规则、熔断规则、系统规则、热点规则、授权规则，可动态修改

### 核心能力

- **流量控制**：按 QPS 或并发线程数限流；三种流控效果——直接拒绝、Warm Up（冷启动预热）、匀速排队（漏桶式削峰）；还支持按调用链路限流
- **熔断降级**：三种策略——慢调用比例、异常比例、异常数；熔断后进入 Open 状态，超时后半开试探恢复，见 [04 熔断与降级](/rate-limiting/governance)
- **热点参数限流**：对某个热点参数值单独限流，比如单个商品 ID 的访问上限，其余参数不受影响
- **系统自适应保护**：从全局视角按 Load、CPU、RT、入口 QPS 做整体保护（借鉴 BBR 的思想）
- **集群流控**：通过 Token Server 实现集群维度的统一限流

### 怎么用

```java
// value：资源名；blockHandler：被流控/熔断时走这里；fallback：业务异常走这里
@SentinelResource(value = "queryUser",
        blockHandler = "onBlock", fallback = "onError")
public User queryUser(Long id) {
    return userClient.get(id);
}

public User onBlock(Long id, BlockException ex) {
    return User.guest();    // 触发流控或熔断时的兜底
}

public User onError(Long id, Throwable t) {
    return User.guest();    // 业务异常时的兜底
}
```

规则可以通过硬编码、Sentinel Dashboard 控制台动态配置，也可以接入 Nacos / Apollo 等配置中心持久化。

## 其他常用组件

- **Guava RateLimiter**：单机令牌桶，API 简单，适合单应用内的细粒度限流
- **Resilience4j**：轻量级容错库，熔断/限流/舱壁/重试模块化，非 Alibaba 栈的 Spring Cloud 首选
- **Nginx**：`limit_req`（漏桶）限制请求速率，`limit_conn` 限制并发连接，网关层第一道防线
- **API 网关**：Kong、APISIX、Spring Cloud Gateway（RequestRateLimiter，底层 Redis + Lua 令牌桶）、Envoy / Istio

## 组件选型对比

| 维度 | Sentinel | Hystrix | Resilience4j |
|---|---|---|---|
| 隔离方式 | 信号量 / 线程池 | 线程池（开销大） | 信号量 |
| 限流能力 | 丰富：多流控效果、热点、集群 | 基础 | 基础 |
| 熔断策略 | 慢调用比例 / 异常比例 / 异常数 | 异常比例 | 异常比例 / 慢调用 |
| 控制台 | 自带 Dashboard | 需 Turbine 聚合 | 无 |
| 规则动态化 | 支持（Nacos/Apollo 等数据源） | 有限 | 需自行实现 |
| 维护状态 | 活跃 | 已停止维护 | 活跃 |

选型建议：Spring Cloud Alibaba / Dubbo 体系首选 Sentinel；轻量级、只需要熔断和限流的场景用 Resilience4j；Hystrix 不建议新项目使用。

::: tip 一句话总结
Sentinel 是微服务的"总闸 + 保险丝盒"，为每个资源定义保护规则；选型上 Alibaba 系用 Sentinel，轻量用 Resilience4j，网关层再叠加 Nginx 或 API 网关。
:::
