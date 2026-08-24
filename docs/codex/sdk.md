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
