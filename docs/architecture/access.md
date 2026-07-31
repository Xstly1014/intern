# 接入层与 BFF：把终端请求翻译成业务用例

接入层位于网关和业务服务之间，负责协议适配、输入验证、DTO 转换和轻量编排。BFF（Backend for Frontend）是面向某类终端定制的接入层，例如 App BFF、Web BFF 和运营后台 BFF。它的价值是让终端体验变化不污染稳定的领域模型。

## 1. 为什么网关之后还需要接入层

![不同终端通过各自 BFF 接入领域服务](/architecture/bff-topology.svg)

网关回答“请求应该去哪里、是否超过流量规则”；接入层回答“这个终端版本提交了什么、怎样转换成业务用例、界面需要怎样的聚合结果”；业务服务回答“业务是否允许、状态怎样变化”。

## 2. 核心职责

### API 契约

定义 URI、HTTP 方法、状态码、字段、分页、排序、错误码和版本兼容策略。契约优先使用 OpenAPI/JSON Schema 描述，在 CI 中检查破坏性变更。字段新增通常向后兼容，删除、改名、类型变化和语义变化需要新版本或迁移期。

### 输入校验与规范化

接入层检查格式和边界，例如必填、长度、枚举、时间格式、文件类型，并把手机号、时区、语言等规范化。它不能只靠校验注解决定“库存是否足够”或“用户能否退款”，这些是业务规则。

### DTO 与命令转换

外部 DTO 是不可信且易变的协议模型，不应直接成为 JPA Entity 或领域对象。应显式转换成 `CreateOrderCommand` 等用例输入，忽略客户端不应控制的字段，如价格、状态、租户和创建人。

### 聚合与编排

商品详情页可能同时需要商品、库存、评价和推荐。BFF 可并行查询并形成展示模型，但需限制扇出数量、设置总超时、定义部分失败策略。跨多个领域的长期业务流程应由业务流程/Saga 负责，而非塞进 Controller。

## 3. 推荐的请求模型

```java
public record CreateOrderRequest(
        @NotEmpty List<OrderItemRequest> items,
        @NotNull Long addressId,
        String couponCode) {}

public record RequestContext(
        String requestId, Long userId, Long tenantId,
        String channel, String locale) {}

@RestController
class OrderController {
    private final CreateOrderUseCase useCase;

    @PostMapping("/v1/orders")
    OrderResponse create(@Valid @RequestBody CreateOrderRequest request,
                         @RequestHeader("Idempotency-Key") String key,
                         RequestContext context) {
        var command = OrderApiMapper.toCommand(request, key, context);
        return OrderApiMapper.toResponse(useCase.handle(command));
    }
}
```

Controller 只承担 HTTP 适配，不开事务、不拼 SQL、不计算价格。`RequestContext` 由可信入口解析，业务代码通过明确参数使用，避免随处读取静态 ThreadLocal。异步切线程时必须显式传播或重建上下文。

## 4. 错误与响应语义

统一错误结构至少包含稳定错误码、用户可理解消息、request ID 和可选字段错误。区分：

| 情况 | 常用状态 | 语义 |
|---|---:|---|
| JSON/字段格式错误 | 400 | 修正请求后再试 |
| 未登录/凭证无效 | 401 | 重新认证 |
| 已登录但无权限 | 403 | 当前身份禁止 |
| 资源不存在 | 404 | 注意避免泄露敏感资源存在性 |
| 状态冲突/幂等冲突 | 409 | 刷新状态或使用原结果 |
| 业务校验失败 | 422 或团队约定 | 请求格式正确但业务不接受 |
| 限流 | 429 | 按 `Retry-After` 退避 |
| 下游不可用 | 503 | 短暂故障，可能可重试 |

不要永远返回 HTTP 200 再把错误塞进 body，也不要把异常栈、SQL 或内部地址返回客户端。

## 5. 查询与写入的不同设计

查询接口可针对界面建立专用 Read Model、批量接口和短缓存，容忍一定陈旧；命令接口强调幂等、权限、状态机和一致性。分页优先游标方案处理持续变化的大数据集；offset 分页适合浅页。导出与大报表转异步任务，返回任务 ID 和下载地址。

## 6. 性能与韧性

- 聚合调用尽量并行，但限制并发和总扇出，避免一次请求放大几十倍。
- 使用批量接口或 DataLoader 解决 N+1，不在循环中逐个 RPC。
- 下游超时小于 BFF 总预算；部分数据可降级时明确标记，不伪造完整成功。
- BFF 应无状态，可水平扩展；会话状态放在签名 Token 或受控存储中。
- WebFlux 只在全链路非阻塞并且确有高并发 I/O 价值时使用，普通 MVC 更易调试。

## 7. 安全与观测

记录 API 名称、版本、终端、状态码、错误码、延迟和扇出，但请求体默认不全量记录。对批量、搜索、导出和后台接口增加行级/字段级授权及审计。关键指标包括每 API 的 RED（Rate、Errors、Duration）、校验失败、下游调用数、响应大小、版本分布和客户端重试率。

## 8. 常见误区

- BFF 直接访问所有服务的数据库，绕过领域边界。
- Controller 同时承担协议、事务、业务规则和第三方 SDK。
- 直接序列化 Entity，导致懒加载、字段泄露和契约随表结构变化。
- 为每个页面建一个微服务，而不是一个面向终端的可维护接入边界。
- 聚合接口串行调用大量下游，任何一个失败就让整页不可用。

下一篇是[身份与安全层](/architecture/security)。
