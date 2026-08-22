# 03 · 存储引擎 InnoDB

::: tip 状态
目录框架已搭建，正文与图解编写中。
:::

## 计划内容

- [ ] InnoDB 存储结构总览：表空间 → 段 → 区 → 页
- [ ] 页（Page）结构：16KB 页的内部布局、行记录格式
- [ ] 行格式：Compact、Dynamic、Compressed，溢出列处理
- [ ] Buffer Pool 缓冲池：页缓存、LRU 淘汰、冷热分区
- [ ] Buffer Pool 命中率与相关参数（innodb_buffer_pool_size）
- [ ] Change Buffer：二级索引更新的延迟合并写
- [ ] 自适应哈希索引 AHI：InnoDB 自动优化的哈希索引
- [ ] 双写缓冲 Doublewrite：防止页写坏（partial page write）
- [ ] InnoDB 的内存结构：Buffer Pool、Change Buffer、Adaptive Hash、Log Buffer
- [ ] InnoDB 与 MyISAM 存储结构对比
