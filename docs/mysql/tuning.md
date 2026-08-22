# 11 · 性能调优

::: tip 状态
目录框架已搭建，正文与图解编写中。
:::

## 计划内容

- [ ] 调优方法论：从定位瓶颈到验证，压测与监控先行
- [ ] 核心参数调优：innodb_buffer_pool_size、innodb_log_file_size、max_connections
- [ ] 刷盘与持久化参数：innodb_flush_log_at_trx_commit、sync_binlog 的组合
- [ ] Buffer Pool 命中率、脏页比例、Redo log 写入监控
- [ ] 连接管理：max_connections、连接池（HikariCP / Druid）参数配置
- [ ] 线程与并发：innodb_thread_concurrency、线程池
- [ ] 临时表与排序参数：tmp_table_size、sort_buffer_size、join_buffer_size
- [ ] 常用监控指标与工具：show status、show variables、performance_schema、Prometheus + mysqld_exporter
- [ ] 硬件与部署：SSD、内存配比、RAID、独立部署
- [ ] 一次完整的慢 SQL 调优案例复盘
