# 09 MCP、插件与 Skills

Codex 的扩展体系分为协议级外部工具、进程内插件和任务知识三类。它们共同解决“核心不可能内置所有能力”的问题，同时保留权限、版本和可观测边界。

## 三类扩展

| 类型 | 代表模块 | 适用场景 |
| --- | --- | --- |
| MCP | `codex-mcp`、`mcp-server`、`ext/mcp` | 外部服务、数据库、浏览器和企业工具 |
| Plugin | `plugin`、`ext/extension-api`、`ext/items` | 新命令、菜单项、Agent 能力 |
| Skill | `skills`、`ext/skills` | 按任务加载的流程、规范和领域知识 |

## MCP 调用链

```text
发现 server
  -> 获取 tool schema
  -> 暴露给模型
  -> 调用前做权限/elicitation
  -> 传输参数并接收结果
  -> 截断、审计、回传上下文
```

MCP server 的描述和返回值都属于不可信外部输入，必须限制网络、文件和凭据访问。长时间运行的 server 还需要启动失败、超时、重连和版本兼容策略。

## Skills 与插件边界

Skill 更接近可加载的任务说明和工作流，Plugin 则拥有明确的扩展 API 和生命周期。两者都应声明依赖、入口和权限，避免在 prompt 中偷偷扩大能力。

## 源码入口

- `codex-rs/mcp-server`、`codex-mcp`、`rmcp-client`
- `codex-rs/plugin`
- `codex-rs/ext/extension-api`、`ext/items`
- `codex-rs/skills`、`ext/skills`

下一章：[Python 与 TypeScript SDK](/codex/sdk)。

## 6. 工具发现与生命周期

MCP server 通常经历启动、握手、能力发现、调用、通知和关闭。发现到的 schema 要缓存但不能无限信任；server 重启后能力可能变化，调用前应处理版本和工具不存在的情况。

## 7. 外部工具的信任边界

外部工具可以返回恶意或错误内容，模型不能因为工具描述写着“安全”就自动获得更高权限。Codex 仍需对文件、网络和凭据进行独立策略判断；外部结果应标记来源，长内容需要截断和脱敏。

## 8. Plugin 与 Skill 的维护成本

插件需要版本兼容、错误隔离和卸载策略；Skill 需要清晰触发条件、输入输出和依赖。把所有知识写进一个巨大 Skill 会增加上下文成本，最好按领域和任务拆分，并为关键流程提供示例和验证命令。

## 9. 扩展测试

至少测试 server 不可用、工具 schema 变化、超时、用户拒绝、返回超大结果、重复调用和权限越界。扩展失败应影响当前能力，不应拖垮整个 CLI 或破坏已有 thread 状态。
