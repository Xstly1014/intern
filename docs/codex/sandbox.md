# 06 审批与跨平台沙箱

Codex 的安全模型是“策略决定能力，平台负责落实”。模型提出的动作先经过权限和审批判断，再进入受限进程；任何无法可靠落实的策略都应拒绝执行。

## 权限决策链

```text
工具请求
  -> 文件/网络/命令分类
  -> 当前 permission profile
  -> 是否需要用户确认
  -> 平台 sandbox 编译策略
  -> 执行或 fail-closed
```

常见模式包括只读、工作区可写和细粒度文件系统映射。审批还要区分一次性批准、同类命令批准和永久配置，避免用户在不理解影响的情况下扩大权限。

## 平台实现

| 平台 | 主要机制 | 关注点 |
| --- | --- | --- |
| Linux | Landlock、Bubblewrap、WSL 路径 | 用户命名空间、挂载和 bwrap 版本 |
| macOS | Seatbelt profile | 可写根目录、网络和系统偏好读取 |
| Windows | restricted token、elevated backend | ACL、进程令牌和精确路径策略 |

网络访问是独立维度：文件可写不代表网络可用。代理、DNS 和出站域名策略必须与文件权限一起记录，便于审计和复现。

## 源码入口

- `codex-rs/sandboxing`：平台无关策略
- `codex-rs/execpolicy`：命令策略判断
- `codex-rs/linux-sandbox`、`bwrap`：Linux
- `codex-rs/windows-sandbox-rs`：Windows
- `codex-rs/core/src/exec_policy.rs`：core 集成

下一章：[会话、历史与状态](/codex/state)。
