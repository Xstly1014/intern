# 05 · MVCC 多版本并发控制

::: tip 状态
目录框架已搭建，正文与图解编写中。
:::

## 计划内容

- [ ] MVCC 是什么：读写不冲突的并发控制方案，解决"读锁"问题
- [ ] 隐藏字段：DB_TRX_ID（事务 ID）、DB_ROLL_PTR（回滚指针）、DB_ROW_ID
- [ ] undo log 版本链：每次修改如何串成版本链（图解）
- [ ] ReadView 读视图：四个关键字段 m_ids / min_trx_id / max_trx_id / creator_trx_id
- [ ] 可见性判断规则：如何沿版本链找到对当前事务可见的版本
- [ ] RC 与 RR 的 ReadView 生成时机差异：RC 每次读都生成、RR 只在第一次读生成
- [ ] 快照读的实现：普通 select 如何走 MVCC
- [ ] 当前读：select ... for update / lock in share mode / insert / update / delete
- [ ] MVCC + 锁如何协同支撑 RR 隔离级别
