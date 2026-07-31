# 计算、容器、JVM 资源与进程生命周期

容器资源边界决定 Java 进程能否稳定运行。CPU throttle、native memory、线程栈、Direct Buffer 和临时盘都可能在堆指标正常时终止进程。

## 1. 内存预算

![Java 容器内存组成与余量](/architecture/infrastructure-java-memory.svg)

容器 limit 要覆盖 Heap、Metaspace、线程栈、Direct/Netty Buffer、Code Cache、GC/JIT/native 库和安全余量。`-Xmx` 不能等于 limit；按真实线程、请求 bytes 和流量压测。OOMKill 与 Java OOME 分别从容器事件、退出码、Heap/Native 指标判断。

## 2. CPU 与调度

CPU request 影响调度保障，limit 可能造成 CFS throttle 和尾延迟。计算密集服务按核数限制并行，阻塞服务仍受连接池/下游约束。监控 usage、throttled time、run queue、GC/JIT 与 P99。

## 3. Requests、Limits 与 QoS

Requests 按正常峰值/调度需求，Limits 防爆炸半径。过低 request 导致节点超卖，过低 limit 频繁 throttle/OOM；只设高 request 则浪费容量。按服务 SLO、负载测试和实际分位持续 Rightsizing。

## 4. 临时盘与文件系统

只读 root filesystem，必要目录挂 `emptyDir` 并设 sizeLimit。日志写 stdout；Heap dump、上传缓冲和转码文件有容量、清理和受控导出。临时盘耗尽也会驱逐 Pod。

## 5. 生命周期与优雅停机

![Java Pod 从摘流到退出的停机时序](/architecture/infrastructure-graceful-shutdown.svg)

收到 SIGTERM 后 readiness 失败，等待 Endpoint/负载均衡传播，停止接新请求/消息，排空在途，提交/回滚事务与 offset，释放 lease，flush 有界遥测并退出。grace period 覆盖传播 + 最长合法处理 + 余量；超时由 SIGKILL 终止。

## 6. 健康探针

Startup 保护慢启动；liveness 只判断进程无法前进，不依赖数据库；readiness 判断可否接新流量。探针低成本、短超时、独立资源，避免依赖抖动触发重启风暴。

## 7. 镜像运行安全

非 root、固定 UID、drop capabilities、seccomp、只读根、最小基础镜像。不在镜像放 shell/调试 Secret；排障用受控 ephemeral container。镜像 digest 固定并持续扫描。

## 8. 上线检查

- Heap 与 native/stack/direct/metaspace 是否共同纳入 limit？
- CPU throttle、OOMKill 和临时盘是否有指标/告警？
- request/limit 是否基于压测和故障余量，而非复制模板？
- SIGTERM、摘流、Consumer revoke 和 grace 是否演练？
- 探针是否各司其职且不依赖会造成风暴的外部服务？

下一篇：[Kubernetes 与网络隔离](/architecture/infrastructure/kubernetes-network)。
