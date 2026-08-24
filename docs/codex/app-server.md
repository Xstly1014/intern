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

## 6. 协议对象的职责

请求对象描述意图，通知对象描述过程，响应对象描述一次请求的结果。不要用通知代替响应，也不要让客户端通过猜测事件顺序维护核心状态。每个 thread、turn、item 和请求都应有稳定 ID，便于重连和日志关联。

## 7. 断线与重连

客户端断线后，daemon 仍可能在执行工具。重连流程应先查询 thread/turn 状态，再从最后确认的事件位置继续，而不是重新提交 prompt。对于无法恢复的流，要返回“已完成但客户端未收到”或“执行状态未知”，避免重复副作用。

## 8. 并发模型

同一 thread 是否允许并行 turn 必须明确；多数交互场景应串行化，避免两个 turn 同时改同一文件。不同 thread 可以并行，但要分别限制进程、资源和日志关联。daemon 还需要处理客户端退出、子进程退出和优雅关闭。

## 9. 为什么不能直接暴露内部类型

内部 Rust 类型经常随实现重构，协议则要服务多个版本的客户端。通过 protocol crate 做稳定边界，可以在内部重命名模块、替换 transport 或增加事件，同时维持 SDK 和桌面端兼容。
