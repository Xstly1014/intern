# 应用用例、领域模型与端口适配器

业务服务内部需要把协议适配、用例编排、领域规则和基础设施分开。目的不是追求固定文件夹，而是让业务规则可在没有 Web、数据库和供应商 SDK 的情况下理解和测试，并使外部技术可替换。

## 1. 依赖方向

![业务服务内部的端口与适配器结构](/architecture/business-hexagonal.svg)

入站适配器把 HTTP、gRPC、消息或任务转换为 Command/Query；应用层执行用例和事务；领域层维护模型与规则；出站端口描述 Repository、支付、消息和时钟需求；基础设施适配器实现这些端口。

依赖指向内层：领域不依赖 Spring、JPA、Kafka 或 Stripe SDK。是否分 Maven Module 可按规模决定，但 ArchUnit/模块测试应验证依赖方向。

## 2. 各角色职责

| 角色 | 应做 | 不应做 |
|---|---|---|
| Controller/Consumer | 协议解析、身份上下文、映射 | 开事务、改 Entity、拼跨服务流程 |
| Application Service | 用例编排、事务、调用领域和端口 | 堆积所有业务 if/else |
| Aggregate/Domain Service | 不变量、状态变化、业务计算 | HTTP、SQL、MQ、配置中心调用 |
| Repository Port | 以领域语言加载/保存聚合 | 暴露通用 ORM 查询器给所有层 |
| Infrastructure Adapter | JPA/HTTP/MQ/SDK 细节 | 决定业务是否允许和如何补偿 |

## 3. 用例模型

一个用例应以业务意图命名，如 `PlaceOrder`、`ApproveRefund`，输入是不可变 Command，输出是明确 Result。不要设计万能 `save(entity)` 或 `updateStatus`，它们绕过意图、授权和状态规则。

```java
public record CancelOrderCommand(
        OrderId orderId,
        String reason,
        String idempotencyKey) {}

public sealed interface CancelOrderResult {
    record Cancelled(OrderId id, Instant cancelledAt) implements CancelOrderResult {}
    record AlreadyCancelled(OrderId id) implements CancelOrderResult {}
}
```

异常用于真正异常或团队统一的领域失败机制；可预期冲突也可用有类型 Result。关键是不能把 SQL 异常和远端客户端异常直接成为公开业务契约。

## 4. 应用编排与领域规则

应用层负责“按什么顺序协作”：加载订单、授权、调用 `order.cancel()`、保存、写 Outbox。领域对象负责“何时允许取消、状态如何改变”。规则需要多个聚合但不自然属于某个实体时，可用领域服务；不要把所有逻辑都命名为 DomainService。

跨服务长流程不应隐藏在一个同步 Application Service 方法里，应使用流程管理器/Saga 持久化状态。

## 5. Repository 和查询

聚合 Repository 按聚合根读写，不让外部修改内部实体。命令侧避免加载巨大对象图；聚合太大时重新审视边界。查询侧可绕过聚合使用专用 Projection/SQL，但仍通过应用查询用例执行租户和字段授权。

返回 Optional/明确 not-found 语义；tenant 必须是查询条件。避免把 Spring Data Repository 直接注入 Controller，使任何入口都能执行任意持久化方法。

## 6. 外部依赖端口

支付、库存、时钟、ID 生成器和事件发布都用业务含义端口，例如 `PaymentAuthorizationPort.authorize()`，而非把某供应商 SDK 接口泄露进用例。适配器将供应商状态、错误、幂等和签名转换为内部模型。

端口不是给每个类都加接口；只有跨边界、需要替换/测试或表达领域所需能力时才有价值。

## 7. 模块化单体落地

同进程模块通过公开 Application API/事件协作，不跨模块直接访问 Repository/Entity。模块拥有自己的表和迁移；本地调用也保留明确 Command/Result。可使用 Spring Modulith 验证依赖、发布模块事件和做模块集成测试，但工具不能代替业务边界。

## 8. 上线检查

- 入站协议模型、用例 Command、领域对象和持久化模型是否分离？
- 用例是否表达业务意图并拥有明确事务边界？
- 领域规则是否不依赖 Spring、HTTP、JPA、MQ 和供应商 SDK？
- Controller/Consumer 是否无法绕过用例直接改 Repository/Entity？
- 查询投影是否仍执行 tenant、行和字段授权？
- 模块依赖是否能由自动化架构测试验证？

下一篇：[聚合、状态机与并发](/architecture/business/aggregate-concurrency)。
