# 09 · 高可用架构

::: tip 状态
目录框架已搭建，正文与图解编写中。
:::

## 计划内容

- [ ] 主从复制原理：binlog → relay log → 重放，三个线程（dump / IO / SQL）
- [ ] 主从复制流程图解：异步复制的完整链路
- [ ] binlog 三种格式对复制的影响
- [ ] 复制方式：异步复制、半同步复制、全同步、增强半同步
- [ ] GTID 复制：全局事务标识，简化主从切换与故障恢复
- [ ] 主从延迟：产生原因、如何监控（Seconds_Behind_Master）、如何缓解
- [ ] 读写分离架构：路由策略、强制走主库的场景
- [ ] 主从数据不一致：原因与校验修复（pt-table-checksum / pt-table-sync）
- [ ] 故障切换：MHA、Orchestrator、MGR（MySQL Group Replication）
- [ ] 高可用方案选型：主从、MGR、InnoDB Cluster、ProxySQL
