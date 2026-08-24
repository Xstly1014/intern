# 06 审批与跨平台沙箱

Codex 的安全模型是“策略决定能力，平台负责落实”。模型提出的动作先经过权限和审批判断，再进入受限进程；任何无法可靠落实的策略都应拒绝执行。

![工具请求的审批与沙箱决策](/codex/sandbox-decision.svg)

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

## 6. 文件策略的优先级

细粒度策略通常按路径匹配，越具体的规则优先级越高。例如工作区整体可写，但 `.git`、密钥文件或构建产物可能需要只读或拒绝。策略编译器必须处理父目录与子目录重叠，不能因为先匹配了宽泛规则就放开更严格的 carve-out。

## 7. 审批界面应展示什么

用户至少需要看到命令、cwd、目标文件、网络目的地、预计影响和批准范围。`rm`、覆盖配置、访问外部服务和改变权限的动作不能只显示“执行命令”。一键批准也应有明确的持续时间和匹配范围。

## 8. 平台差异带来的测试问题

Linux 上可用的 Landlock 规则不等于 Windows ACL 规则；Bubblewrap 还依赖 user namespace 和版本能力；WSL 的路径转换可能改变真实目标。平台适配层应把“无法表达策略”报告为拒绝，而不是回退到更宽松的全权限执行。

## 9. 安全故障排查

遇到“命令无法运行”，先确认是策略拒绝、沙箱启动失败、cwd 不存在、工具本身退出还是网络被阻断。诊断输出应包含选中的 backend、权限摘要和平台信息，但不能泄漏令牌或完整环境变量。
