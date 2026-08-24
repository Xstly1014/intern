# 图解技术

> 让后端核心技术不再难懂

基于 VitePress 构建的后端技术知识库，用图解 + 通俗讲解的方式，系统梳理后端开发与分布式系统核心知识。

## 在线阅读

站点地址：[https://xstly1014.github.io/intern/](https://xstly1014.github.io/intern/)

## 内容模块

### 系统架构全景指南

从客户端到数据层的完整运行时架构指南，覆盖边缘层、网关、接入、业务、数据、中间件、安全、可观测与容灾全链路。

- 客户端与边缘层：DNS、CDN、DDoS 防护、WAF、负载均衡、TLS/HTTP、多地域容灾
- API 网关层：路由、认证授权、流控、灰度发布
- 业务服务层与数据存储层
- 可观测性与故障排查

[进入系统架构 →](https://xstly1014.github.io/intern/architecture/)

### 消息队列

消息队列核心知识图解，涵盖 RabbitMQ、Kafka、RocketMQ 主流产品。

- 消息可靠性保证、顺序消费、幂等性设计
- 消息堆积处理与性能调优
- 选型对比与场景实战

[进入消息队列 →](https://xstly1014.github.io/intern/mq/)

### MySQL

从索引原理到高可用架构的完整 MySQL 知识体系。

- 索引原理与存储引擎
- 事务隔离级别与 MVCC
- 锁机制与日志体系（redo/undo/binlog）
- 高可用与分库分表

[进入 MySQL →](https://xstly1014.github.io/intern/mysql/)

### 限流

四大限流算法、分布式限流与网关限流知识图解。

- 计数器、滑动窗口、漏桶、令牌桶算法
- Sentinel 与网关层限流实践
- 分布式限流方案

[进入限流 →](https://xstly1014.github.io/intern/rate-limiting/)

### 面试高频 100 题

字节跳动面试官视角，Java 后端方向五大模块面试题，每模块 100 道高频题。

- [Redis 面试高频 100 题](https://xstly1014.github.io/intern/interview/redis.html)：数据结构、持久化、高可用集群、缓存问题、分布式锁、场景实战
- [MySQL 面试高频 100 题](https://xstly1014.github.io/intern/interview/mysql.html)：索引、事务、锁、日志、高可用与分库分表
- [JVM 热门面试题 100 道](https://xstly1014.github.io/intern/interview/jvm.html)：内存模型、垃圾回收、类加载、调优实战
- [分布式系统热门面试题 100 道](https://xstly1014.github.io/intern/interview/distributed.html)：CAP/BASE、分布式锁、一致性、事务、服务治理
- [消息队列面试高频 100 题](https://xstly1014.github.io/intern/interview/mq.html)：可靠性、顺序性、幂等性、选型对比

[进入面试专题 →](https://xstly1014.github.io/intern/interview/)

### LeetCode Hot 100

按题型组织的算法解析，附 Java 实现与图解。

[进入 LeetCode →](https://xstly1014.github.io/intern/leetcode/)

### Codex 源码与架构

Codex 项目源码与架构分析。

[进入 Codex →](https://xstly1014.github.io/intern/codex/)

## 阅读特色

- **图解风格**：每篇文章配有 SVG 架构图、流程图，一图胜千言
- **对话形式**：面试专题以【面试官】【面试者】问答形式呈现，贴近真实面试场景
- **全文搜索**：内置本地搜索，快速定位知识点
- **响应式设计**：完美适配桌面和移动端
- **A4 打印友好**：面试专题页面适配打印格式，便于纸质复习

## License

MIT