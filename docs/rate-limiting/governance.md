# 04 · 熔断与降级

熔断和降级是两种不同的自保策略：**熔断是"下游出问题了，暂时停止调它"**，由故障被动触发，防止自己被拖垮；**降级是"我扛不住了，主动关掉非核心功能"**，是容量上的取舍，保住核心链路。

## 熔断状态机

熔断的核心是三态状态机：

| 状态 | 行为 | 流转条件 |
|---|---|---|
| Closed 关闭 | 正常放行，统计失败 | 失败率超阈值 → Open |
| Open 打开 | 快速失败，不再调用下游 | 冷却期过后 → Half-Open |
| Half-Open 半开 | 放行少量请求试探 | 试探成功 → Closed；试探失败 → Open |

要点：熔断不是永久断开。Open 状态经过一段冷却期后进入 Half-Open，放少量请求试探，成功则恢复、失败则继续断开。

## 什么时候熔断

- **下游错误率超标**：比如近 10 秒失败比例超过 50%
- **下游响应过慢**：慢调用比例超过阈值（如 RT 超过 1s 的请求占比 60%）
- **资源被拖住**：连接超时、线程池被某个下游占满
- 目的：切断对故障依赖的调用，防止线程和资源被耗尽、故障向上游级联
- 注意：对非幂等的写操作（下单、扣款）熔断要谨慎，通常熔断读接口、对写接口改用快速失败 + 补偿

## 怎么熔断

实现 = 滑动窗口统计 + 状态机 + 兜底逻辑，以 Resilience4j 为例：

```java
// 规则：失败率 >= 50% 就熔断，熔断 5 秒后半开试探
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)          // 失败率阈值
    .slowCallDurationThreshold(Duration.ofSeconds(1))
    .waitDurationInOpenState(Duration.ofSeconds(5)) // 熔断时长
    .permittedNumberOfCallsInHalfOpenState(3)       // 试探请求数
    .build();

CircuitBreaker cb = CircuitBreaker.of("paymentService", config);
try {
    return cb.executeSupplier(() -> paymentClient.pay(order));
} catch (CallNotPermittedException e) {
    return fallback();   // 熔断期间不再调下游，直接走兜底
}
```

Sentinel 的熔断规则（慢调用比例 / 异常比例 / 异常数）机制相同，只是配置方式不同。

## 什么时候降级

- **大促或流量高峰前**：预案式降级，提前关掉非核心功能腾出容量
- **系统已过载**：CPU、RT、队列积压超水位，自动触发
- **依赖故障后**：被熔断的下游短期内恢复不了，给用户一个兜底体验
- 判断标准只有一个：**这个功能是不是核心链路**。推荐、评论、积分、个性化可以降；下单、支付、扣库存不能降

## 怎么降级

降级没有状态机，本质是"开关 + 兜底数据"，常见四个层次：

- **功能级**：配置中心一键关闭非核心功能（最常用）
- **数据级**：返回缓存、默认值、静态兜底数据
- **写降级**：同步改异步，先入队列事后补偿
- **体验级**：页面简化、关闭个性化渲染

```java
public List<Item> getRecommend(Long uid) {
    if (switchCenter.isOff("recommend")) {  // 预案开关：大促前手动关闭
        return Collections.emptyList();
    }
    try {
        return recommendService.personalize(uid);
    } catch (Exception e) {
        return hotListCache.get();          // 兜底：返回缓存的热门列表
    }
}
```

## 熔断 vs 降级

| 维度 | 熔断 | 降级 |
|---|---|---|
| 触发原因 | 下游高失败率 / 慢调用 | 容量不足或故障，主动取舍 |
| 性质 | 被动自保，自动状态机 | 主动牺牲，人工预案或规则触发 |
| 作用对象 | 对某个下游依赖的调用 | 业务功能（通常是非核心） |
| 动作 | 短路调用，快速失败 | 关功能 / 返回兜底数据 |
| 恢复方式 | 半开试探后自动恢复 | 高峰或故障过后人工/自动恢复 |
| 典型实现 | Resilience4j、Sentinel 熔断规则 | 功能开关、配置中心、fallback |

## 组合方式

两者是配合关系：熔断决定"什么时候停止调用"，降级决定"停止调用后返回什么"。三种实际组合：

- **熔断 + 降级（最常见）**：面向用户的核心链路调用。熔断检测到下游故障后自动触发 fallback，返回缓存、默认值或友好提示，用户无感知或弱感知
- **只熔断，不降级**：内部非关键调用，失败可以直接向上抛。比如调用日志服务、埋点服务，熔断后快速失败即可，没必要准备兜底数据
- **只降级，不熔断**：与下游故障无关的主动取舍。比如大促前手动关闭评论、推荐功能的开关，这时根本没有"被熔断的下游"

```java
// blockHandler：被熔断/限流时走这里；fallback：业务异常时走这里
@SentinelResource(value = "queryStock",
        fallback = "queryStockFallback")
public Stock queryStock(Long skuId) {
    return stockClient.query(skuId);   // 正常调用下游
}

// 降级兜底：熔断触发后返回安全默认值
public Stock queryStockFallback(Long skuId, Throwable t) {
    return Stock.unknown(skuId);
}
```

::: tip 一句话总结
熔断是"你坏了，我暂时不调你"，降级是"我扛不住了，先关掉不重要的"；熔断是同一套自保机制的触发器，降级是它的落地点。
:::
