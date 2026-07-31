# 结构化日志、异常、脱敏、采样与审计

日志用于还原离散事件上下文。生产日志必须机器可解析、字段稳定、安全且成本可控；把所有请求 Body 和堆栈写进去既不可靠也不合规。

## 1. 日志事件模型

![结构化日志从事件到存储检索](/architecture/observability-log-pipeline.svg)

统一包含 timestamp、level、service/version/env/region、event.name、operation/route、result/error.code、trace/span/request ID 和必要 tenant 哈希。消息文案给人读，查询依赖结构字段。

## 2. 记录边界

异常在能够决定结果的边界记录一次；下层可附 context 后抛出，避免每层重复同一堆栈。预期业务拒绝不打 ERROR；未知异常保留 fingerprint/stack。启动、关闭、配置版本、连接状态和状态转换使用明确事件名。

## 3. 敏感数据

默认禁止 Token、Cookie、密码、私钥、卡号、证件、完整 Body/SQL 参数和环境全集。字段白名单优于事后正则。日志异常对象、HTTP Client wire log、ORM bind 参数和第三方 SDK debug 都要审查。

## 4. 采样与保留

ERROR/关键审计尽量完整；高频成功访问按确定性/概率采样；重复异常聚合并保留计数。保留按数据价值和合规分层，热检索、冷归档和删除策略明确。采样决策与比例写入事件。

## 5. 日志可靠性

应用异步写 stdout/Agent，有界缓冲；后端故障时丢低优先级并计数，不阻塞请求。容器退出前短暂 flush，但不能无限等待。多行堆栈由结构化 encoder 保持一个事件。

## 6. 审计区别

![访问日志、安全事件与业务审计分工](/architecture/observability-log-audit.svg)

访问日志可采样、短保留；安全事件用于检测；业务审计在事务成功点记录 actor/subject/resource/action/result/policy/version 和前后摘要，追加存储、受限修改。Trace ID 可关联，但 Trace 不替代审计。

## 7. 成本治理

按 service/team/event 统计 bytes、索引量、查询和保留成本。删除无查询价值字段，避免高频循环 INFO。临时 debug 有审批、范围、TTL 和自动回退，不能永久打开全量 Body。

## 8. 上线检查

- 是否用稳定 event.name/code 查询，而非解析自由文本？
- 异常是否只在责任边界记录一次并正确分级？
- Body、Header、SDK、SQL 和异常是否经过敏感数据审查？
- 采样、保留、丢弃和成本是否可见且有 owner？
- 遥测后端故障是否不会阻塞业务？
- 业务审计是否在成功语义处产生且不可被普通人员修改？

下一篇：[Trace、上下文与剖析](/architecture/observability/tracing)。
