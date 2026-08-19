# 03 · 分布式限流

四种算法**全部都可以用 Redis 实现**——本质是把单机版维护的状态（计数、时间戳、水位、令牌数）搬到 Redis，再用 Lua 脚本保证"读-改-写"的原子性。

核心原理只有一条：**Redis 是单线程执行 Lua 脚本的，把"读状态 → 计算 → 写状态"放进一个 Lua 脚本，就天然原子**，不需要分布式锁。

## 固定窗口：INCR + EXPIRE（最简单）

```lua
-- KEYS[1]: 限流key（含窗口编号）  ARGV[1]: 阈值  ARGV[2]: 窗口秒数
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])   -- 首个请求时设置过期
end
return current <= tonumber(ARGV[1]) and 1 or 0
```

Key 设计成 `rate_limit:{接口}:{窗口编号}`，窗口翻转就是换新 key，天然清零。注意 INCR 和 EXPIRE 必须放在同一个 Lua 里，分开执行可能丢失过期时间，key 永久残留。

## 滑动窗口：ZSET（最精确）

用 ZSET 存每个请求，score 为时间戳：

```lua
-- ARGV: now(ms), window(ms), limit, 请求唯一ID
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1] - ARGV[2])  -- 逐出过期请求
if redis.call('ZCARD', KEYS[1]) < tonumber(ARGV[3]) then
    redis.call('ZADD', KEYS[1], ARGV[1], ARGV[4])              -- 记录本次请求
    redis.call('PEXPIRE', KEYS[1], ARGV[2])
    return 1
end
return 0
```

缺点是每请求存一条记录，高 QPS 下大 key、内存贵。工程上的折中是改成"子窗口聚合"：用 Hash 按子窗口存计数，牺牲少量精度换内存（Sentinel 的思路搬到 Redis）。

## 令牌桶 / 漏桶：Lua 懒结算（最推荐）

和单机版完全同构：Hash 里存 `tokens` 和上次结算时间，每次请求按时间差懒结算：

```lua
-- ARGV: rate(个/秒), capacity, now(ms)
local state = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(state[1]) or tonumber(ARGV[2])   -- 初始满桶
local ts     = tonumber(state[2]) or ARGV[3]
-- 懒补令牌（漏桶则镜像改为"先漏水"）
tokens = math.min(tonumber(ARGV[2]),
                  tokens + (ARGV[3] - ts) / 1000 * tonumber(ARGV[1]))
local allowed = 0
if tokens >= 1 then
    tokens = tokens - 1
    allowed = 1
end
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', ARGV[3])
redis.call('PEXPIRE', KEYS[1], 60000)
return allowed
```

## 现成方案（不用自己写 Lua）

- **Redis-Cell 模块**：GCRA 算法，一条 `CL.THROTTLE` 命令搞定，只存一个"下次理论放行时间"，极省内存
- **Redisson 的 `RRateLimiter`**：Java 生态现成的分布式令牌桶
- **Spring Cloud Gateway 的 `RequestRateLimiter`**：底层就是 Redis + Lua 令牌桶

## 工程要点

- **时钟问题**：多机时间可能不一致，建议用 `redis.call('TIME')` 取 Redis 服务端时间
- **Key 必须设过期**：限流 key 是无限增长的，漏设 EXPIRE 会堆满内存
- **Redis 故障策略**：fail-open（放行，限流失效但业务可用）还是 fail-closed（拒绝，保护优先），按业务选
- **性能参考**：单个 Lua 脚本微秒级，单 Redis 实例扛 10 万+ QPS 的限流判断没问题

## 方案对比

| 算法 | Redis 数据结构 | 关键命令 | 特点 |
|---|---|---|---|
| 固定窗口 | String | INCR + EXPIRE | 最简单，临界点问题仍在 |
| 滑动窗口 | ZSET | ZREMRANGEBYSCORE + ZCARD | 精确，内存开销大 |
| 漏桶 | Hash（水位+时间） | Lua 懒结算 | 匀速整形 |
| 令牌桶 | Hash（令牌+时间） | Lua 懒结算 | 允许突发，生产首选 |
| GCRA | String（理论放行时间） | Redis-Cell CL.THROTTLE | 省内存，一条命令 |

## 待补充

- [ ] 集群限流与单机限流的换算及误差来源
- [ ] 两级限流架构：本地限流 + 分布式限流
- [ ] 精确性与性能的权衡：近似窗口、采样统计

::: tip 一句话总结
四种算法都能用 Redis 实现，套路都是"状态存 Redis、读写包进 Lua"；入门用 INCR+EXPIRE，精确用 ZSET，生产首选 Lua 版令牌桶，偷懒直接用 Redis-Cell 或 Redisson。
:::
