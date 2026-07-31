# DTO、命令、领域模型与显式映射

外部 request DTO 是不可信、需长期兼容的协议模型；用例 Command/Query 表达应用意图；领域对象保护业务不变量；response DTO 为终端展示服务。将四者合成一个 Java 类，短期少写 Mapper，长期会让数据库、业务和公网 API 无法独立演进。

## 1. 四种模型的流转

![DTO、命令、领域模型与响应的映射](/architecture/bff-dto-command.svg)

| 模型 | 信任级别 | 变化原因 |
|---|---|---|
| Request DTO | 不可信 | App/API 契约、兼容与序列化 |
| Command/Query | 已规范化但仍需用例校验 | 用例意图与应用编排 |
| Domain Model | 通过行为维护不变量 | 领域规则与状态机 |
| Response DTO/View Model | 可对外输出 | 终端展示、字段授权与版本 |
| Persistence Model | 内部持久化 | 索引、ORM、迁移与查询性能 |

## 2. 为什么不直接绑定 Entity

- Mass Assignment：客户端通过额外字段修改 `status`、`price`、`tenantId`、`ownerId`或 `approved`。
- 契约泄漏：加一列、改 ORM 关系或重命名字段立即变成公网 API 变更。
- 数据泄露：内部备注、风控标签、删除标识和密钥摘要被默认序列化。
- 懒加载：序列化时隐式触发 N+1，或 Session 关闭后报错。
- 循环关系：双向 ORM 关联导致无限递归或巨大响应。
- 权限不清：同一 Entity 在用户端、运营端和审计端需要不同字段。

## 3. 白名单映射

映射代码应明确列出允许从客户端进入用例的字段，服务端事实来自可信上下文或业务查询。

```java
public record CreateOrderRequest(
        List<OrderItemRequest> items,
        Long addressId,
        String couponCode) {}

public record CreateOrderCommand(
        UserId userId,
        TenantId tenantId,
        List<OrderItemInput> items,
        AddressId addressId,
        CouponCode couponCode,
        IdempotencyKey idempotencyKey,
        Instant deadline) {}

final class OrderApiMapper {
    static CreateOrderCommand toCommand(
            CreateOrderRequest request,
            RequestContext context,
            String idempotencyKey) {
        return new CreateOrderCommand(
                context.userId(),              // 不从 request 读
                context.tenantId(),            // 不从 request 读
                mapItems(request.items()),
                new AddressId(request.addressId()),
                CouponCode.optional(request.couponCode()),
                new IdempotencyKey(idempotencyKey),
                context.deadline());
    }
}
```

`price`、`discountAmount`、`orderStatus`、`createdBy` 不在 request DTO 中，即使客户端 JSON 偷传也不会进入 Command。价格和优惠由领域用例根据服务端事实计算。

## 4. Mapper 写在哪里

- API Mapper 属于接入适配器，知道 request/response DTO 与用例输入/输出。
- 它不依赖 JPA Repository、远程客户端或交易规则。
- 需查询补齐的业务数据应由用例处理，不在 MapStruct expression 中偷做 I/O。
- 显式手写 Mapper 适合安全敏感和语义差异大的边界；MapStruct 可减少机械字段复制，但要使用未映射字段报错。

## 5. Command 不是一个另版 DTO

Command 表达用例意图，可使用强类型 `UserId`、`Money`、`AddressId`，携带已建立的主体和 deadline。它不应包含 HTTP request、Servlet API、JSON 注解或网关 Header 名称，否则用例无法被消息消费者、批处理或单元测试复用。

Command 的“已规范化”不意味着“业务一定允许”。用例仍要查资源、做授权、调用领域行为并持久化。

## 6. Response DTO 是安全与体验边界

Response Mapper 负责：

- 只输出该终端/主体可见的字段。
- 把内部强类型转为明确协议表示，如金额 + 币种、时刻 + 偏移。
- 组织 links/actions/capabilities，但“可执行”只是 UI 提示，命令调用时仍重新授权。
- 屏蔽内部 ID、风控标记、供应商原始响应和调试字段。
- 对老 App 保留契约字段和默认语义，不把兼容 `if` 扩散到领域层。

## 7. 查询投影与领域对象

对读 API，不必为了“纯洁”每次恢复完整聚合再序列化。可使用专用 Query Service/Read Model 直接生成接近 response 的投影，前提是它的数据所有权、更新延迟、权限和陈旧语义明确。

写 API 不能为了方便绕过聚合与不变量直接修改读模型。

## 8. Controller 应该薄到什么程度

Controller 可以有明确的协议逻辑：读 Header、选择契约、触发校验、调用 Mapper/用例、设置 HTTP 响应。“薄”不是一行代码，而是不包含业务决策和基础设施细节。

不应在 Controller：

- 开启跨多个远程服务的“事务”。
- 用 `if/else` 计算价格、状态迁移和促销资格。
- 拼 SQL、操作 ORM Entity 或读他人服务的库。
- 直接调用支付/短信厂商 SDK。
- 捕获 `Exception` 并统一返回“系统忙”或 HTTP 200。

## 9. 映射测试

- 每个可控 request 字段都正确进入 Command，每个服务端字段都不受 request 影响。
- null/缺失/空值、时区、金额、枚举和边界数量正确。
- Mapper 对未映射新字段报错，防止 DTO 演进后静默丢失。
- Response 在不同主体/终端下只暴露允许字段。
- 契约快照/序列化测试验证 JSON 名称、类型、缺失与顺序不受内部重构破坏。

下一篇：[聚合、并发、扇出与部分失败](/architecture/access/aggregation)。
