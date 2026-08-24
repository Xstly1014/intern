# 10 Python 与 TypeScript SDK

SDK 的目标是让应用嵌入 Codex，而不是让调用方重新实现 Agent 循环。它们提供 thread、turn、流式事件、配置和认证等高层 API，并复用 CLI/App Server 的协议。

## 两种调用模型

```text
run(prompt)
  -> 等待 turn.completed
  -> 返回 final_response / finalResponse

runStreamed(prompt)
  -> async events
  -> item.completed / turn.completed
```

Python SDK 通过 `Codex` 和 `thread.run` 暴露对象模型；TypeScript SDK 通过 `@openai/codex-sdk` 启动 CLI 并交换 JSONL 事件。连续调用同一个 Thread 即可保留上下文。

## 重要配置

| 配置 | 作用 |
| --- | --- |
| workingDirectory | 限定项目和 Git 检查范围 |
| skipGitRepoCheck | 在非 Git 工作目录中运行 |
| config/configOverrides | 传递模型、权限和网络配置 |
| env | 控制 CLI 子进程环境 |
| outputSchema | 要求结构化 JSON 结果 |

图片输入通过结构化 entry 传递，避免把二进制内容直接拼入文本。resume thread 依赖持久化 ID，因此生产应用需要保存 ID 和错误状态。

## 集成注意点

SDK 调用会触发真实本地命令和文件修改，应明确工作目录、权限 profile、超时和取消策略。流式事件处理器必须能承受重复通知、长工具输出和 turn 失败；不要只依赖最终字符串判断是否成功。

## 源码入口

- `sdk/python`
- `sdk/typescript`
- `codex-cli/bin/codex.js`
- `codex-rs/app-server-client`

下一章：[构建、测试与发布](/codex/build-release)。

## 6. SDK 调用的实际边界

SDK 不是本地函数调用，而是启动或连接一个 Agent 运行时。调用方需要准备 Node/Python、Codex 二进制、认证、工作目录和可用网络；容器中还要明确是否允许 Git、shell 和沙箱。

## 7. 流式事件处理

建议把事件处理分成三层：

1. 传输层负责读取 JSONL、处理 EOF 和进程退出。
2. 协议层负责反序列化、未知事件兼容和 request/turn ID。
3. 业务层负责展示文本、记录工具调用、更新进度和决定是否取消。

不要在业务层通过字符串匹配判断“任务成功”；应使用 `turn.completed`、usage 和错误字段。

## 8. 生产集成清单

- 为每个 thread 保存外部业务 ID 和 Codex thread ID。
- 限制工作目录，不要把服务器根目录作为默认 cwd。
- 明确取消、超时、重试和并发 turn 语义。
- 对 final response、工具事件和日志分别做敏感信息处理。
- 在升级 CLI 时测试协议兼容和结构化输出 schema。
