# SFTP、文件批量交换、导入导出与对账

遗留 ERP、银行和清算系统常通过文件交换。文件集成延迟高、错误粒度粗，但仍需与 API 一样的认证、完整性、幂等、Schema、状态和恢复设计。

## 1. 文件交付协议

![批量文件从生成到确认的交付链路](/architecture/integration-file-transfer.svg)

Producer 先写临时文件，完成后生成 Manifest（文件名、批次 ID、Schema version、行数、bytes、checksum、时间范围），再原子 rename/上传完成标记。Consumer 只处理有完整 Manifest 的批次，校验大小、hash、签名和解密。

避免按“目录里出现文件”立即读取，防止半文件。每批唯一 batch ID，重传沿用 ID 和内容 hash；同 ID 不同内容拒绝。

## 2. 安全传输

SFTP 使用独立账号/SSH Key、固定 host key、chroot/目录权限和轮换；对象存储使用跨账号角色/短时签名。敏感文件 PGP/信封加密并签名，传输 TLS 不能替代静态文件保护。

文件名和路径服务端生成，禁止路径穿越。落地隔离区，恶意扫描后处理；原始文件访问和保留受审计。

## 3. Schema 与解析

明确编码、分隔/转义、换行、日期时区、金额单位、null、Header/Trailer、列顺序和 Schema version。流式解析，限制文件 bytes、行长、列数和总行；坏行不能导致内存全量加载。

CSV/Excel 不是无 Schema。黄金样本覆盖引号、换行、BOM、大数、重复列和公式注入；导出给表格时转义公式前缀。

## 4. 导入状态机

![批次与逐行处理状态机](/architecture/integration-batch-state.svg)

批次状态 RECEIVED→VALIDATED→PROCESSING→COMPLETED/PARTIAL/REJECTED。先做整文件结构/控制总数验证，再逐行以 `(batchId,rowBusinessKey)` 幂等处理。每批 checkpoint 可重启。

契约定义全有或全无、允许部分成功还是逐行结果文件。不能处理一半崩溃后既无记录又整体重跑产生重复。

## 5. 结果与错误文件

结果 Manifest 包含 accepted/rejected/duplicate 数、每行稳定错误码和内部/外部 ID。错误文件不回显不必要敏感字段；永久错误由供应商修正后以新版本/同业务 Key 重传。

处理完成 ACK 和业务最终完成可分开，避免供应商误认为“文件收到了”等于“所有业务成功”。

## 6. 对账

![API 回调文件与内部账本的对账闭环](/architecture/integration-reconciliation.svg)

以供应商结算/账单为外部权威，与内部 operation/ledger 按 request ID、金额、币种、状态和时间窗口比较。差异分延迟、内部缺失、外部缺失、重复、金额不符和未知。

自动修复只处理可证明安全的类型；其余工单包含证据、建议动作、影响金额/用户和审批。修复通过幂等业务命令，不直接改表。

## 7. 调度与容量

文件可能迟到、重复、乱序和跨日。按业务日期 + batch sequence 判断完整性，等待窗口结束仍缺文件则告警。导入限速保护 DB/供应商，历史补跑与当日批次分优先级。

监控到达及时率、校验失败、处理速率、最老批次、行错误率、结果文件发送和对账差异金额。

## 8. 上线检查

- 是否用 Manifest/checksum/signature/完成标记避免半文件？
- batch ID、内容 hash 和行业务 Key 是否支持安全重传？
- Parser 是否流式且限制 bytes/行/列/编码复杂度？
- 部分成功、checkpoint、结果文件和重新提交语义是否明确？
- 文件加密、账号、host key、路径、保留和删除是否受控？
- 对账差异是否可分类、自动安全修复或进入审计工单？

下一篇：[Java 生产参考架构](/architecture/integration/reference)。
