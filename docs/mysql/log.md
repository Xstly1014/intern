# 07 · 日志体系

::: tip 状态
目录框架已搭建，正文与图解编写中。
:::

## 计划内容

- [ ] MySQL 日志全景：redo log、undo log、binlog、relay log、慢查询日志、错误日志
- [ ] redo log 重做日志：InnoDB 特有、物理日志、循环写、WAL 预写日志思想
- [ ] redo log 的 write pos 与 checkpoint，崩溃恢复如何靠 redo log
- [ ] undo log 回滚日志：逻辑日志，支撑事务回滚与 MVCC 版本链
- [ ] binlog 归档日志：Server 层、逻辑日志、三种格式（statement / row / mixed）
- [ ] redo log vs binlog：层次、内容、写入方式、用途的全方位对比
- [ ] 两阶段提交：为什么需要，保证 redo log 与 binlog 一致
- [ ] 两阶段提交的 prepare / commit 流程与崩溃恢复判断
- [ ] 组提交 group commit：binlog 与 redo log 的刷盘优化
- [ ] 刷盘策略：innodb_flush_log_at_trx_commit 与 sync_binlog 的组合与取舍
