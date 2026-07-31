# 生产参考架构、演进路径与检查清单

接入层可以是单体中的一组适配器，也可以是按终端拆分的独立 BFF 集群。选择依据是契约、团队、发布、容量和故障隔离，不是系统“看起来像不像微服务”。

## 1. 多终端 BFF 参考拓扑

![多终端 BFF 生产参考架构](/architecture/bff-reference-topology.svg)

参考边界：

- API 网关执行路由、凭证初检、配额和灰度，将可信主体传给 BFF。
- Web/App/Admin BFF 各自拥有终端契约、聚合与兼容，不拥有领域数据库。
- 业务服务提供稳定用例与批量查询，执行资源授权和不变量。
- 专用读模型可为高频页面提供已组合投影，但数据来源、陈旧和权限明确。
- 契约库、测试、遥测和发布平台是共享能力，不把共享 Java DTO jar 当契约治理。

## 2. 阶段一：模块化单体内的接入层

![接入层从单体模块到多 BFF 的演进](/architecture/bff-evolution.svg)

建议代码边界：

![模块化单体中的 BFF 代码依赖边界](/architecture/bff-module-boundaries.svg)

图中箭头表示编译期依赖方向。为保持边界：

- API 模块可依赖 application，application 不依赖 API DTO/Servlet。
- 多个 API 模块复用用例，但各自拥有 response DTO 和错误兼容。
- 不因为同进程就让 Controller 直接读 Repository/Entity。
- 使用架构测试（如 ArchUnit）防止依赖方向回流。

这是大多数小团队的正确起点，运维单元少，本地调用快，同时保留未来拆分边界。

## 3. 阶段二：共享 BFF 部署

当接入层需要独立伸缩、发布或隔离公网攻击面，可拆成一个共享 BFF 集群，代码内仍按 Web/App/Admin 模块化。

必须新增：

- 网关到 BFF 信任契约、mTLS/网络隔离与可信 Header。
- BFF 到业务服务的超时、连接池、熔断、批量与契约测试。
- 独立 SLO、容量、值班、优雅发布和故障演练。
- 分布式链路中的 deadline、Trace、幂等和错误映射。

如果拆分后仍共享业务服务数据库或把所有领域代码复制到 BFF，就只增加了网络跳数，没有建立边界。

## 4. 阶段三：按终端拆分 BFF

当 Web/App/Admin 的团队、发布、容量、安全和故障需求确实不同时拆分。

| BFF | 典型特征 |
|---|---|
| Web BFF | Cookie/Token mediation、CSRF、与 Web 同步发布、SSR/GraphQL |
| App BFF | 长尾 App 版本、弱网响应裁剪、离线/幂等契约 |
| Admin BFF | 强 MFA/审计、行字段权限、批量/导出、更严并发 |
| Partner BFF/API | API Key/mTLS/签名、长期契约、配额与开发者支持 |

不要复制领域用例、错误码与下游 SDK 到每个 BFF 后独立漂移。可共享稳定的平台客户端、Trace/安全库和契约生成工具，但不共享一个包含所有终端 DTO 与业务逻辑的“common”大 jar。

## 5. 一个商品详情页的参考设计

| 维度 | 参考决策 |
|---|---|
| 入口 | `GET /app/v2/products/{id}`，明确 App 契约与 locale |
| 主资源 | 商品服务，失败则整体 404/503 |
| 价格/库存 | 并行读取，不伪造默认值，不可用时禁止购买 |
| 评价 | 批量/摘要读模型，可 partial unavailable |
| 推荐 | 短预算，可降级为空，有独立 bulkhead |
| deadline | BFF 总 500 ms，为本地组装和响应留余量，下游子预算不相加 |
| 缓存 | 公开商品短缓存，个人价格/权限不跨用户缓存 |
| 响应 | 面向 App 的裁剪 View Model，区分真实空值与 unavailable |
| 观测 | complete/partial/stale、扇出、下游尝试、响应大小、App 版本 |

## 6. 一个创建订单的参考设计

1. Controller 校验 JSON、items 数量、address ID 格式和 `Idempotency-Key`。
2. 从可信 RequestContext 取 user/tenant/deadline，不从 Body 取所有者与价格。
3. Mapper 白名单构建 `CreateOrderCommand`。
4. 只调用订单应用用例；库存预占、幂等与事务由用例/领域协作完成。
5. 将用例结果映射为 201/200、409、422、503/504 等稳定契约。
6. 审计业务成功由订单服务在事务语义上产生，BFF 记录接入结果与 Trace。

## 7. 发布策略

- 契约先行：新字段/下游能力先向后兼容发布，BFF 再使用，最后清理旧能力。
- 数据库/消息变更不与 BFF 流量灰度假设自动隔离，必须先前后兼容。
- 按 App 版本/用户稳定哈希灰度，同时观察技术 RED、partial 与用户旅程。
- 发布时 readiness 先失败再摘流，等待传播后排空并行请求/长流，容器宽限覆盖全过程。

## 8. 故障演练矩阵

| 故障 | 预期 |
|---|---|
| 必需下游慢 | 总 deadline 内失败，取消可选分支，无无界排队 |
| 可选下游断开 | 返回契约化 partial，不伪造数据，指标可见 |
| 下游连接池耗尽 | 该下游 bulkhead 拒绝，其他路由不被拖垮 |
| 缓存不可用/热 Key | 受控回源、单飞、容量保护，不串租户 |
| 错误的身份 Header | 拒绝而不选一个信任，产生安全事件 |
| 旧 App 调新契约 | 兼容 adapter 保持旧语义或明确升级错误 |
| 遥测管道阻塞 | 有界丢弃/采样，不阻塞 API，丢弃量告警 |
| 实例/AZ 终止 | 剩余容量承接，无重连/重试风暴，在途影响可查 |

## 9. 完整评审清单

### 契约

- 成功、错误、Header、分页、幂等、null/缺失和默认值是否都定义？
- 是否有 Schema diff、语义评审、消费者契约和老 App 回归？
- 废弃是否有真实调用方清单和无流量证据？

### 模型与边界

- Request DTO、Command/Query、Domain、Response DTO、Persistence 是否分离？
- 映射是否白名单，客户端无法控制所有者、租户、价格与状态？
- BFF 是否不直连领域数据库、不持有核心规则和长流程？

### 聚合与韧性

- 扇出、并发、队列、连接池、尝试和总 deadline 是否有上限？
- 必需/可选下游与 complete/partial/stale 是否是显式契约？
- N+1 是否使用批量/DataLoader/读模型解决？
- 缓存是否不跨 subject/tenant/role/locale/version 串数据？

### 安全

- 上下文是否来自可信链路，在并行/异步中不丢失不串请求？
- 资源/行级授权是否由数据所有者执行，BFF 只做展示裁剪？
- Cookie/Token mediation 是否完整处理 CSRF、Session、刷新、注销与横向扩展？
- 访问日志与 Trace 是否不记录 Token、Cookie、Body 与敏感个人数据？

### 运维

- 指标是否能按 API、终端版本、下游与结果完整性定位？
- 容量测试是否使用真实扇出、响应大小、慢下游和客户端版本？
- 是否已演练必需/可选下游失败、缓存失效、连接池耗尽与上下文异常？
- 实例/AZ 失败和发布时，剩余容量与 drain timeout 是否经过验证？

下一层是[身份与安全层](/architecture/security)：接入层消费可信身份上下文，而系统级身份、授权模型、租户隔离与密钥治理需要跨层统一设计。
