# 11 构建、测试与发布

Codex 同时使用 Cargo workspace、Bazel、npm 和平台安装脚本。构建系统的目标不是只生成一个二进制，而是为 Linux、macOS、Windows、CLI、SDK 和 App Server 产出可验证的发行物。

![Codex 构建与发布流水线](/codex/release-pipeline.svg)

## 构建分层

```text
Rust crates
  -> cargo test / cargo build
  -> Bazel 跨平台与 hermetic 目标
  -> 平台二进制与 resources
  -> npm / Homebrew / installer
  -> GitHub Release / OpenAI release mirror
```

`codex-rs/Cargo.toml` 统一 workspace 依赖和 lint；`BUILD.bazel` 文件补充 Bazel 目标。`codex-cli` 只负责 npm 包和启动器，真正二进制来自 Rust 构建。

## 测试层次

| 层次 | 验证内容 |
| --- | --- |
| 单元测试 | parser、policy、Markdown、状态转换 |
| crate 集成测试 | core、exec-server、app-server 协议 |
| 端到端测试 | 真实命令、审批、文件变化和回放 |
| 跨平台测试 | Linux sandbox、Wine exec、Windows backend |
| 发布验证 | 安装器、签名、版本、启动和升级 |

安全相关改动至少要覆盖允许、拒绝、边界路径和错误回退；协议改动要检查 SDK 和 TUI 是否仍能消费事件。

## 发布链路

GitHub Actions 执行依赖安装、构建、测试和制品上传。安装脚本默认从 OpenAI release endpoint 获取元数据，必要时回退 GitHub Releases。发布时要固定依赖、保留符号和校验 checksum，避免供应链变化导致不可复现。

## 源码入口

- 根目录 `package.json`、`codex-cli/package.json`
- `codex-rs/Cargo.toml`
- 各 crate `BUILD.bazel`
- `.github/workflows`
- `scripts/` 与 `docs/install.md`

下一章：[源码阅读实践](/codex/reading)。

## 6. 为什么同时使用 Cargo 和 Bazel

Cargo 适合 Rust 开发者快速迭代和 crate 级测试，Bazel 更适合可复现、跨平台和大型构建图。两套入口必须保持目标和依赖一致，否则“本地 Cargo 通过、发布 Bazel 失败”会成为常见问题。

## 7. 依赖与供应链

workspace 中包含大量网络、加密、终端和平台依赖。升级依赖时要同时检查 lockfile、许可证、平台特性、编译脚本和安全公告。Git 依赖要固定 revision，发布制品要记录源码版本和构建环境。

## 8. 发布前验证

```text
格式化与 lint
  -> crate 单测
  -> 集成 / 端到端测试
  -> 各平台打包
  -> 安装器验证
  -> 启动、登录、sandbox smoke test
  -> checksum / 签名 / release
```

发布验证不能只检查二进制能启动，还要验证默认配置、认证、工作区权限、`codex exec`、MCP 和升级路径。
