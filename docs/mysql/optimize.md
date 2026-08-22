# 08 · SQL 优化

::: tip 状态
目录框架已搭建，正文与图解编写中。
:::

## 计划内容

- [ ] 慢查询定位：slow_query_log、long_query_time、mysqldumpslow / pt-query-digest
- [ ] EXPLAIN 执行计划：type、key、rows、Extra 等关键字段详解
- [ ] EXPLAIN 的 type 等级：system → const → eq_ref → ref → range → index → ALL
- [ ] Extra 关键信息：Using index、Using filesort、Using temporary、Using index condition
- [ ] 索引优化：如何建立高效索引、避免索引失效
- [ ] 深分页优化：limit 1000000,10 的问题与延迟关联 / 游标方案
- [ ] count 优化：count(*) vs count(1) vs count(列)，为什么 InnoDB 要全表扫
- [ ] order by 优化：filesort 与索引排序，如何消除 filesort
- [ ] join 优化：NLJ、BNL，小表驱动大表，被驱动表加索引
- [ ] SQL 改写技巧：子查询转 join、批量操作、分页游标、避免 select *
