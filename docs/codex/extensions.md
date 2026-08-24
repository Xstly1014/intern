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
