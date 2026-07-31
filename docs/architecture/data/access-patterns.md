# Repository、ORM、SQL 与数据库连接

数据访问层的目标不是隐藏数据库存在，而是用业务语义约束可执行查询，把 tenant、事务、并发和性能要求固定在可测试的边界内。ORM 能减少映射代码，但不会替你设计聚合、索引或事务。

## 1. 访问模型

![命令 Repository 与查询 Projection 的访问分工](/architecture/data-repository-query.svg)

命令侧 Repository 按聚合根加载和保存，支持版本/锁语义；查询侧按场景直接生成 Projection，可用 SQL、MyBatis/JdbcClient，不必为了“纯 DDD”加载完整聚合。两者都必须执行 tenant、行和字段授权。

不要把通用 `JpaRepository<Entity,Id>` 直接暴露给 Controller，也不要返回 `Stream<Entity>` 让事务外继续懒加载。

## 2. JPA/Hibernate 使用边界

- Entity 生命周期、脏检查和一级缓存只在明确事务内可信。
- LAZY 在序列化/事务外触发会失败或制造隐式 N+1；禁用 Open Session in View。
- `equals/hashCode` 不依赖可变字段或未持久化 ID 的错误语义。
- 批量 DML 绕过 Persistence Context，执行后 clear/refresh，避免内存状态陈旧。
- `save()` 不是业务行为；聚合应通过用例和行为方法改变。
- Fetch Join、EntityGraph 和投影按具体查询使用，避免把所有关系设 EAGER。

复杂报表、批量更新和数据库特性用显式 SQL 更清楚；不必强迫 ORM 表达所有操作。

## 3. N+1 与批量

![N+1 查询与批量加载的成本差异](/architecture/data-n-plus-one.svg)

列表加载 100 个订单后逐个访问用户/商品会产生 1+N。解决顺序：面向页面的 Projection Join、批量 `IN` 查询并回组装、Fetch Join（注意分页）、DataLoader 或专用读模型。不能仅通过扩大连接池掩盖 N+1。

批量写使用 JDBC Batch/批量 SQL，控制每批行数、参数数、事务大小和内存；大批处理分段可重入，保存 checkpoint，避免一条百万行事务。

## 4. 参数化与动态查询

所有值使用参数绑定；排序字段、列名和表名不能作为普通参数，必须从服务端白名单映射。动态过滤使用结构化 Query Object/Specification，限制过滤字段、操作符、组合深度和返回行数。

LIKE 前导通配、任意正则和用户可控复杂排序可能绕过索引，应有专用搜索方案或成本限制。

## 5. 连接池容量

![应用实例、连接池与数据库总预算](/architecture/data-connection-budget.svg)

总潜在连接 = 实例数 × 每实例最大池 + 后台任务 + 管理/迁移连接。池大小由数据库 CPU、IO、锁和并发吞吐反推，不是越大越快。过多活跃查询只会增加上下文切换和锁竞争。

分别监控 active、idle、pending、acquire time、usage time、timeout。连接泄露检测只用于定位，不能替代正确关闭。应用扩容、故障转移和滚动发布时会短期重叠更多实例，要预留峰值。

## 6. 超时和取消

连接获取、SQL 执行、事务和请求 deadline 分层配置；数据库 statement timeout 小于用户总预算。请求取消时尽量取消 SQL并归还连接，但要验证驱动行为。超时后事务结果可能未知，写操作不能换幂等键盲目重试。

## 7. 读写数据源路由

Repository 不应根据方法名自动把所有 `find*` 路由副本：授权、写后读和流程决策可能需要主库最新值。用例明确一致性需求，由数据访问层选择权威主库或允许陈旧的副本。

事务中首次读后再写必须保持同一数据源/连接语义，不能中途从副本切主造成前置条件陈旧。

## 8. 上线检查

- Command Repository 与 Query Projection 是否按用途分离？
- 是否关闭 OSIV，并消除序列化期懒加载与 N+1？
- 动态查询字段/排序是否白名单且有结果/复杂度上限？
- 批量任务是否分段、可重入、有 checkpoint 且不持长事务？
- 连接池总量是否覆盖扩容、滚动发布、任务和故障转移峰值？
- 每层 timeout 是否服从端到端 deadline，超时写入是否按结果未知处理？

下一篇：[关系建模、索引与查询](/architecture/data/modeling-indexing)。
