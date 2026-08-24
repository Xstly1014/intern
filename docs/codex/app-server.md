# 08 App Server 与多端接入

App Server 将 Codex 核心从单一终端进程提升为可被桌面端、IDE、SDK 和远程控制复用的服务。它暴露的是 thread、turn、事件和审批协议，而不是 TUI 的内部状态。

## 进程关系

```text
桌面端 / IDE / SDK
        ⇅ app-server-protocol
app-server daemon
        ⇅ client / transport
codex-core + exec-server + state
```

`app-server` 负责服务入口和请求路由，`app-server-protocol` 定义请求、响应、通知和错误，`app-server-transport` 处理传输，`app-server-daemon` 管理常驻生命周期。

## 生命周期

1. 客户端建立连接并协商能力。
2. 创建或恢复 thread，提交工作目录和配置。
3. 启动 turn，服务端连续发送文本、工具、审批和状态事件。
4. 客户端对审批或用户输入作出响应。
5. turn 完成后返回 usage、状态和最终结果；thread 可继续复用。

这种设计使事件流成为稳定契约：TUI 可以渲染，SDK 可以转成对象，桌面端可以显示更丰富的面板。

## 可靠性与权限

服务端必须处理客户端断线、重复请求、请求 ID、并发 turn 和 daemon 重启。客户端重连时要通过 thread/turn ID 恢复，而不是假定所有事件都实时到达。权限仍由 core 和执行层决定，App Server 不能绕过沙箱。

## 源码入口

- `codex-rs/app-server/src/main.rs`
- `codex-rs/app-server-protocol`
- `codex-rs/app-server-transport`
- `codex-rs/app-server-client`
- `codex-rs/app-server-daemon`

下一章：[MCP、插件与 Skills](/codex/extensions)。
