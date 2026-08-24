import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '图解技术',
  description: '图解消息队列、MySQL、Redis 等后端核心技术',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: [
    /\.html$/,
  ],
  base: '/intern/',

  head: [
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['link', { rel: 'icon', href: '/favicon.svg' }],
  ],

  markdown: {
    lineNumbers: true,
    image: { lazyLoading: true },
    // 支持容器语法 ::: tip / warning / danger / details
    config: (md) => {
      // 可在此扩展 markdown-it 插件
    },
  },

  themeConfig: {
    outline: {
      label: '本页目录',
      level: [2, 3],
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    lastUpdatedText: '最后更新于',

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '目录',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    nav: [
      { text: '首页', link: '/' },
      { text: '系统架构', link: '/architecture/', activeMatch: '/architecture/' },
      { text: '消息队列', link: '/mq/', activeMatch: '/mq/' },
      { text: '限流', link: '/rate-limiting/', activeMatch: '/rate-limiting/' },
      { text: 'MySQL', link: '/mysql/', activeMatch: '/mysql/' },
      { text: 'Redis', link: '/redis/', activeMatch: '/redis/' },
      { text: 'LeetCode', link: '/leetcode/', activeMatch: '/leetcode/' },
      { text: 'Codex', link: '/codex/', activeMatch: '/codex/' },
      { text: '面试专题', link: '/interview/', activeMatch: '/interview/' },
    ],

    sidebar: {
      // ==================== Codex ====================
      '/codex/': [
        {
          text: 'Codex 源码与架构',
          collapsed: false,
          items: [
            { text: '专题导读与目录', link: '/codex/' },
            { text: '01 项目总览', link: '/codex/overview' },
            { text: '02 CLI 与终端界面', link: '/codex/cli' },
          ],
        },
      ],

      // ==================== 系统架构 ====================
      '/architecture/': [
        {
          text: '系统架构全景指南',
          collapsed: false,
          items: [
            { text: '专题导读', link: '/architecture/' },
            { text: '01 总概览', link: '/architecture/overview' },
            {
              text: '02 客户端与边缘层',
              link: '/architecture/edge',
              collapsed: false,
              items: [
                { text: '2.0 章节总览', link: '/architecture/edge' },
                { text: '2.1 客户端工程与弱网', link: '/architecture/edge/client' },
                { text: '2.2 DNS 与 GSLB', link: '/architecture/edge/dns' },
                { text: '2.3 CDN 与边缘缓存', link: '/architecture/edge/cdn' },
                { text: '2.4 DDoS、WAF 与 Bot', link: '/architecture/edge/security' },
                { text: '2.5 负载均衡与反向代理', link: '/architecture/edge/load-balancing' },
                { text: '2.6 TLS 与 HTTP 协议', link: '/architecture/edge/protocol-tls' },
                { text: '2.7 可靠性、容量与多地域', link: '/architecture/edge/resilience' },
                { text: '2.8 可观测性与故障排查', link: '/architecture/edge/observability' },
                { text: '2.9 生产参考架构', link: '/architecture/edge/reference' },
              ],
            },
            {
              text: '03 API 网关层',
              link: '/architecture/gateway',
              collapsed: false,
              items: [
                { text: '3.0 职责边界与运行时', link: '/architecture/gateway' },
                { text: '3.1 路由、发现与连接', link: '/architecture/gateway/routing' },
                { text: '3.2 认证、授权与信任', link: '/architecture/gateway/security' },
                { text: '3.3 流控、超时与韧性', link: '/architecture/gateway/resilience' },
                { text: '3.4 灰度、版本与协议', link: '/architecture/gateway/release' },
                { text: '3.5 控制面与配置发布', link: '/architecture/gateway/control-plane' },
                { text: '3.6 容量、观测与排障', link: '/architecture/gateway/observability' },
                { text: '3.7 生产参考架构', link: '/architecture/gateway/reference' },
              ],
            },
            {
              text: '04 接入层与 BFF',
              link: '/architecture/access',
              collapsed: false,
              items: [
                { text: '4.0 职责边界与请求管线', link: '/architecture/access' },
                { text: '4.1 API 契约与版本', link: '/architecture/access/contracts' },
                { text: '4.2 DTO、命令与映射', link: '/architecture/access/mapping' },
                { text: '4.3 聚合、扇出与失败', link: '/architecture/access/aggregation' },
                { text: '4.4 上下文、授权与审计', link: '/architecture/access/context-security' },
                { text: '4.5 错误契约与兼容', link: '/architecture/access/errors' },
                { text: '4.6 性能、观测与测试', link: '/architecture/access/performance' },
                { text: '4.7 生产参考架构', link: '/architecture/access/reference' },
              ],
            },
            {
              text: '05 身份与安全层',
              link: '/architecture/security',
              collapsed: false,
              items: [
                { text: '5.0 信任边界与纵深防御', link: '/architecture/security' },
                { text: '5.1 用户身份、Token 与会话', link: '/architecture/security/identity-session' },
                { text: '5.2 工作负载身份与服务信任', link: '/architecture/security/workload-trust' },
                { text: '5.3 授权模型与策略执行', link: '/architecture/security/authorization' },
                { text: '5.4 多租户、数据与隐私', link: '/architecture/security/tenant-data' },
                { text: '5.5 应用、API 与供应链安全', link: '/architecture/security/application-security' },
                { text: '5.6 审计、检测与事件响应', link: '/architecture/security/audit-incident' },
                { text: '5.7 Java 生产参考架构', link: '/architecture/security/reference' },
              ],
            },
            {
              text: '06 业务服务层',
              link: '/architecture/business',
              collapsed: false,
              items: [
                { text: '6.0 职责边界与运行时', link: '/architecture/business' },
                { text: '6.1 领域划分与限界上下文', link: '/architecture/business/domain-boundaries' },
                { text: '6.2 应用用例与内部架构', link: '/architecture/business/application-layer' },
                { text: '6.3 聚合、状态机与并发', link: '/architecture/business/aggregate-concurrency' },
                { text: '6.4 本地事务、幂等与 Outbox', link: '/architecture/business/transaction-idempotency' },
                { text: '6.5 Saga、TCC 与对账修复', link: '/architecture/business/distributed-workflow' },
                { text: '6.6 服务通信与韧性', link: '/architecture/business/communication-resilience' },
                { text: '6.7 Java 生产参考架构', link: '/architecture/business/reference' },
              ],
            },
            {
              text: '07 数据访问与存储层',
              link: '/architecture/data',
              collapsed: false,
              items: [
                { text: '7.0 职责边界与数据版图', link: '/architecture/data' },
                { text: '7.1 Repository、ORM 与连接', link: '/architecture/data/access-patterns' },
                { text: '7.2 关系建模、索引与查询', link: '/architecture/data/modeling-indexing' },
                { text: '7.3 事务、隔离与锁', link: '/architecture/data/transactions' },
                { text: '7.4 缓存、搜索与对象存储', link: '/architecture/data/derived-stores' },
                { text: '7.5 复制、读写分离与分片', link: '/architecture/data/replication-sharding' },
                { text: '7.6 备份恢复与 Schema 演进', link: '/architecture/data/recovery-migrations' },
                { text: '7.7 Java 生产参考架构', link: '/architecture/data/reference' },
              ],
            },
            {
              text: '08 异步与中间件层',
              link: '/architecture/middleware',
              collapsed: false,
              items: [
                { text: '8.0 职责边界与能力版图', link: '/architecture/middleware' },
                { text: '8.1 消息模型、语义与选型', link: '/architecture/middleware/messaging-model' },
                { text: '8.2 生产端可靠性与 Outbox', link: '/architecture/middleware/producer-reliability' },
                { text: '8.3 消费、幂等、顺序与重平衡', link: '/architecture/middleware/consumer-processing' },
                { text: '8.4 重试、延迟与死信', link: '/architecture/middleware/retry-dlq' },
                { text: '8.5 流控、积压与容量', link: '/architecture/middleware/backpressure-capacity' },
                { text: '8.6 调度、配置、发现与协调', link: '/architecture/middleware/platform-capabilities' },
                { text: '8.7 Java 生产参考架构', link: '/architecture/middleware/reference' },
              ],
            },
            {
              text: '09 外部集成层',
              link: '/architecture/integration',
              collapsed: false,
              items: [
                { text: '9.0 职责边界与集成版图', link: '/architecture/integration' },
                { text: '9.1 防腐层、模型与契约', link: '/architecture/integration/anti-corruption' },
                { text: '9.2 出站调用与未知结果', link: '/architecture/integration/outbound-calls' },
                { text: '9.3 Webhook 回调与幂等', link: '/architecture/integration/webhooks' },
                { text: '9.4 身份、签名与数据合规', link: '/architecture/integration/security-compliance' },
                { text: '9.5 韧性、配额与多供应商', link: '/architecture/integration/resilience-routing' },
                { text: '9.6 文件、批量与对账集成', link: '/architecture/integration/batch-reconciliation' },
                { text: '9.7 Java 生产参考架构', link: '/architecture/integration/reference' },
              ],
            },
            {
              text: '10 可观测与运维层', link: '/architecture/observability', collapsed: false,
              items: [
                { text: '10.0 职责边界与信号架构', link: '/architecture/observability' },
                { text: '10.1 指标、SLI、SLO 与预算', link: '/architecture/observability/metrics-slo' },
                { text: '10.2 结构化日志与审计', link: '/architecture/observability/logging' },
                { text: '10.3 Trace、上下文与剖析', link: '/architecture/observability/tracing' },
                { text: '10.4 告警、降噪与 Runbook', link: '/architecture/observability/alerting' },
                { text: '10.5 事件响应与复盘', link: '/architecture/observability/incident-response' },
                { text: '10.6 容量、健康与变更运维', link: '/architecture/observability/operations' },
                { text: '10.7 Java 生产参考架构', link: '/architecture/observability/reference' },
              ],
            },
            { text: '11 基础设施与交付层', link: '/architecture/infrastructure', collapsed: false, items: [
              { text: '11.0 职责边界与运行版图', link: '/architecture/infrastructure' },
              { text: '11.1 计算、容器与 JVM 资源', link: '/architecture/infrastructure/runtime' },
              { text: '11.2 Kubernetes 与网络隔离', link: '/architecture/infrastructure/kubernetes-network' },
              { text: '11.3 IaC、环境与 Secret', link: '/architecture/infrastructure/iac-environments' },
              { text: '11.4 CI、制品与供应链', link: '/architecture/infrastructure/ci-supply-chain' },
              { text: '11.5 部署、灰度与回滚', link: '/architecture/infrastructure/deployment' },
              { text: '11.6 高可用、弹性与灾备', link: '/architecture/infrastructure/resilience-dr' },
              { text: '11.7 Java 生产参考架构', link: '/architecture/infrastructure/reference' },
            ] },
            { text: '12 端到端落地与演进', link: '/architecture/practice', collapsed: false, items: [
              { text: '12.0 落地框架与演进地图', link: '/architecture/practice' },
              { text: '12.1 架构输入、约束与容量', link: '/architecture/practice/requirements-capacity' },
              { text: '12.2 从第一版到平台化', link: '/architecture/practice/evolution-stages' },
              { text: '12.3 订单端到端设计', link: '/architecture/practice/order-journey' },
              { text: '12.4 渐进拆分与数据迁移', link: '/architecture/practice/migration' },
              { text: '12.5 架构评审、ADR 与治理', link: '/architecture/practice/review-governance' },
              { text: '12.6 生产就绪、上线与验收', link: '/architecture/practice/production-readiness' },
              { text: '12.7 指标驱动的持续演进', link: '/architecture/practice/continuous-evolution' },
            ] },
          ],
        },
      ],

      // ==================== 消息队列 ====================
      '/mq/': [
        {
          text: '第一章 消息队列基础',
          collapsed: false,
          items: [
            { text: 'Q1 消息队列本质', link: '/mq/basics/q01' },
            { text: 'Q2 三大核心作用', link: '/mq/basics/q02' },
            { text: 'Q3 同步 vs 异步', link: '/mq/basics/q03' },
            { text: 'Q4 点对点 vs 发布订阅', link: '/mq/basics/q04' },
            { text: 'Q5 推模式 vs 拉模式', link: '/mq/basics/q05' },
            { text: 'Q6 消息队列对比选型', link: '/mq/basics/q06' },
            { text: 'Q7 引入 MQ 的代价', link: '/mq/basics/q07' },
            { text: 'Q8 消息模型术语', link: '/mq/basics/q08' },
            { text: 'Q9 消息投递语义', link: '/mq/basics/q09' },
            { text: 'Q10 JMS vs AMQP', link: '/mq/basics/q10' },
            { text: 'Q11 消息幂等性', link: '/mq/basics/q11' },
            { text: 'Q12 消息积压本质', link: '/mq/basics/q12' },
          ],
        },
        {
          text: '第二章 RabbitMQ 核心架构',
          collapsed: false,
          items: [
            { text: 'Q13 RabbitMQ 核心组件', link: '/mq/rabbitmq-core/q13' },
            { text: 'Q14 Exchange 四种类型', link: '/mq/rabbitmq-core/q14' },
            { text: 'Q15 Direct Exchange 路由', link: '/mq/rabbitmq-core/q15' },
            { text: 'Q16 Topic Exchange 通配', link: '/mq/rabbitmq-core/q16' },
            { text: 'Q17 Fanout Exchange 广播', link: '/mq/rabbitmq-core/q17' },
            { text: 'Q18 Headers Exchange', link: '/mq/rabbitmq-core/q18' },
            { text: 'Q19 Queue 属性详解', link: '/mq/rabbitmq-core/q19' },
            { text: 'Q20 Binding 与 Routing Key', link: '/mq/rabbitmq-core/q20' },
            { text: 'Q21 Connection vs Channel', link: '/mq/rabbitmq-core/q21' },
            { text: 'Q22 Virtual Host 作用', link: '/mq/rabbitmq-core/q22' },
            { text: 'Q23 死信队列 DLX', link: '/mq/rabbitmq-core/q23' },
            { text: 'Q24 延迟队列实现', link: '/mq/rabbitmq-core/q24' },
            { text: 'Q25 优先级队列', link: '/mq/rabbitmq-core/q25' },
            { text: 'Q26 TTL 消息过期', link: '/mq/rabbitmq-core/q26' },
            { text: 'Q27 持久化机制', link: '/mq/rabbitmq-core/q27' },
            { text: 'Q28 镜像队列 vs Quorum', link: '/mq/rabbitmq-core/q28' },
          ],
        },
        {
          text: '第三章 RabbitMQ 高级特性',
          collapsed: false,
          items: [
            { text: 'Q29 生产者确认机制', link: '/mq/rabbitmq-advanced/q29' },
            { text: 'Q30 消费者 ACK 机制', link: '/mq/rabbitmq-advanced/q30' },
            { text: 'Q31 prefetch 预取机制', link: '/mq/rabbitmq-advanced/q31' },
            { text: 'Q32 消息重试与死信', link: '/mq/rabbitmq-advanced/q32' },
            { text: 'Q33 背压与流控', link: '/mq/rabbitmq-advanced/q33' },
            { text: 'Q34 RabbitMQ 集群架构', link: '/mq/rabbitmq-advanced/q34' },
            { text: 'Q35 节点类型 disk/ram', link: '/mq/rabbitmq-advanced/q35' },
            { text: 'Q36 Quorum Queue 仲裁队列', link: '/mq/rabbitmq-advanced/q36' },
            { text: 'Q37 Federation 联邦', link: '/mq/rabbitmq-advanced/q37' },
            { text: 'Q38 Shovel 数据迁移', link: '/mq/rabbitmq-advanced/q38' },
            { text: 'Q39 消息追踪', link: '/mq/rabbitmq-advanced/q39' },
            { text: 'Q40 RabbitMQ 插件体系', link: '/mq/rabbitmq-advanced/q40' },
          ],
        },
        {
          text: '第四章 Kafka 核心架构',
          collapsed: false,
          items: [
            { text: 'Q41 Kafka 核心概念', link: '/mq/kafka-core/q41' },
            { text: 'Q42 Topic 与 Partition', link: '/mq/kafka-core/q42' },
            { text: 'Q43 Partition 分区作用', link: '/mq/kafka-core/q43' },
            { text: 'Q44 Leader 与 Follower', link: '/mq/kafka-core/q44' },
            { text: 'Q45 ISR 机制', link: '/mq/kafka-core/q45' },
            { text: 'Q46 Controller 控制器', link: '/mq/kafka-core/q46' },
            { text: 'Q47 Consumer Group', link: '/mq/kafka-core/q47' },
            { text: 'Q48 Rebalance 重平衡', link: '/mq/kafka-core/q48' },
            { text: 'Q49 Offset 管理', link: '/mq/kafka-core/q49' },
            { text: 'Q50 __consumer_offsets', link: '/mq/kafka-core/q50' },
            { text: 'Q51 Producer 工作流程', link: '/mq/kafka-core/q51' },
            { text: 'Q52 Consumer 拉取流程', link: '/mq/kafka-core/q52' },
            { text: 'Q53 ZooKeeper 作用', link: '/mq/kafka-core/q53' },
            { text: 'Q54 KRaft 模式', link: '/mq/kafka-core/q54' },
            { text: 'Q55 消息格式演进', link: '/mq/kafka-core/q55' },
            { text: 'Q56 Log Segment 分段', link: '/mq/kafka-core/q56' },
            { text: 'Q57 副本同步机制', link: '/mq/kafka-core/q57' },
            { text: 'Q58 HW 与 LEO', link: '/mq/kafka-core/q58' },
          ],
        },
        {
          text: '第五章 Kafka 高性能原理',
          collapsed: false,
          items: [
            { text: 'Q59 顺序写盘', link: '/mq/kafka-performance/q59' },
            { text: 'Q60 Page Cache', link: '/mq/kafka-performance/q60' },
            { text: 'Q61 零拷贝 sendfile', link: '/mq/kafka-performance/q61' },
            { text: 'Q62 批量发送', link: '/mq/kafka-performance/q62' },
            { text: 'Q63 消息压缩', link: '/mq/kafka-performance/q63' },
            { text: 'Q64 分区并行', link: '/mq/kafka-performance/q64' },
            { text: 'Q65 索引文件', link: '/mq/kafka-performance/q65' },
            { text: 'Q66 Time Index', link: '/mq/kafka-performance/q66' },
            { text: 'Q67 消费者组并行度', link: '/mq/kafka-performance/q67' },
            { text: 'Q68 粘性分区器', link: '/mq/kafka-performance/q68' },
            { text: 'Q69 Broker 网络模型', link: '/mq/kafka-performance/q69' },
            { text: 'Q70 Kafka vs 传统 MQ', link: '/mq/kafka-performance/q70' },
          ],
        },
        {
          text: '第六章 可靠性与一致性',
          collapsed: false,
          items: [
            { text: 'Q71 生产者不丢消息', link: '/mq/reliability/q71' },
            { text: 'Q72 acks 参数详解', link: '/mq/reliability/q72' },
            { text: 'Q73 Broker 不丢消息', link: '/mq/reliability/q73' },
            { text: 'Q74 min.insync.replicas', link: '/mq/reliability/q74' },
            { text: 'Q75 unclean.leader.election', link: '/mq/reliability/q75' },
            { text: 'Q76 消费者不丢消息', link: '/mq/reliability/q76' },
            { text: 'Q77 Exactly-Once 语义', link: '/mq/reliability/q77' },
            { text: 'Q78 幂等生产者', link: '/mq/reliability/q78' },
            { text: 'Q79 事务消息', link: '/mq/reliability/q79' },
            { text: 'Q80 消息重复根因', link: '/mq/reliability/q80' },
            { text: 'Q81 消息顺序性保证', link: '/mq/reliability/q81' },
            { text: 'Q82 分布式事务消息', link: '/mq/reliability/q82' },
          ],
        },
        {
          text: '第七章 运维与调优',
          collapsed: false,
          items: [
            { text: 'Q83 分区数选择', link: '/mq/ops-tuning/q83' },
            { text: 'Q84 副本数选择', link: '/mq/ops-tuning/q84' },
            { text: 'Q85 消息积压排查', link: '/mq/ops-tuning/q85' },
            { text: 'Q86 Rebalance 优化', link: '/mq/ops-tuning/q86' },
            { text: 'Q87 磁盘容量规划', link: '/mq/ops-tuning/q87' },
            { text: 'Q88 监控指标体系', link: '/mq/ops-tuning/q88' },
            { text: 'Q89 RabbitMQ 内存管理', link: '/mq/ops-tuning/q89' },
            { text: 'Q90 Kafka 参数调优', link: '/mq/ops-tuning/q90' },
            { text: 'Q91 集群扩容', link: '/mq/ops-tuning/q91' },
            { text: 'Q92 版本升级方案', link: '/mq/ops-tuning/q92' },
          ],
        },
        {
          text: '第八章 场景与实战',
          collapsed: false,
          items: [
            { text: 'Q93 订单异步处理', link: '/mq/scenarios/q93' },
            { text: 'Q94 秒杀削峰', link: '/mq/scenarios/q94' },
            { text: 'Q95 日志收集架构', link: '/mq/scenarios/q95' },
            { text: 'Q96 消息广播通知', link: '/mq/scenarios/q96' },
            { text: 'Q97 延迟任务设计', link: '/mq/scenarios/q97' },
            { text: 'Q98 Agent 事件驱动', link: '/mq/scenarios/q98' },
            { text: 'Q99 跨机房消息同步', link: '/mq/scenarios/q99' },
            { text: 'Q100 系统设计综合题', link: '/mq/scenarios/q100' },
          ],
        },
      ],

      // ==================== 限流 ====================
      '/rate-limiting/': [
        {
          text: '限流',
          collapsed: false,
          items: [
            { text: '专题导读', link: '/rate-limiting/' },
            { text: '01 基础概念', link: '/rate-limiting/basics' },
            { text: '02 核心算法', link: '/rate-limiting/algorithms' },
            { text: '03 分布式限流', link: '/rate-limiting/distributed' },
            { text: '04 熔断与降级', link: '/rate-limiting/governance' },
            { text: '05 框架与组件', link: '/rate-limiting/frameworks' },
            { text: '06 工程落地', link: '/rate-limiting/engineering' },
            { text: '07 进阶专题', link: '/rate-limiting/advanced' },
            { text: '08 实践与代码', link: '/rate-limiting/practice' },
          ],
        },
      ],

      // ==================== MySQL ====================
      '/mysql/': [
        {
          text: 'MySQL',
          collapsed: false,
          items: [
            { text: '专题导读', link: '/mysql/' },
            { text: '01 基础与架构', link: '/mysql/basics' },
            { text: '02 索引原理', link: '/mysql/indexing' },
            { text: '03 存储引擎 InnoDB', link: '/mysql/engine' },
            { text: '04 事务与隔离级别', link: '/mysql/transaction' },
            { text: '05 MVCC', link: '/mysql/mvcc' },
            { text: '06 锁机制', link: '/mysql/lock' },
            { text: '07 日志体系', link: '/mysql/log' },
            { text: '08 SQL 优化', link: '/mysql/optimize' },
            { text: '09 高可用架构', link: '/mysql/ha' },
            { text: '10 分库分表', link: '/mysql/sharding' },
            { text: '11 性能调优', link: '/mysql/tuning' },
            { text: '12 实战场景', link: '/mysql/practice' },
          ],
        },
      ],

      // ==================== Redis（预留） ====================
      '/redis/': [
        {
          text: 'Redis',
          collapsed: false,
          items: [
            { text: '敬请期待', link: '/redis/' },
          ],
        },
      ],

      // ==================== LeetCode Hot 100 ====================
      '/leetcode/': [
        {
          text: '哈希',
          items: [
            { text: '1. 两数之和', link: '/leetcode/hash/1' },
            { text: '49. 字母异位词分组', link: '/leetcode/hash/49' },
            { text: '128. 最长连续序列', link: '/leetcode/hash/128' },
          ],
        },
        {
          text: '双指针',
          items: [
            { text: '11. 盛最多水的容器', link: '/leetcode/two-pointers/11' },
            { text: '15. 三数之和', link: '/leetcode/two-pointers/15' },
            { text: '42. 接雨水', link: '/leetcode/two-pointers/42' },
            { text: '283. 移动零', link: '/leetcode/two-pointers/283' },
          ],
        },
        {
          text: '滑动窗口',
          items: [
            { text: '3. 无重复字符的最长子串', link: '/leetcode/sliding-window/3' },
            { text: '438. 找到字符串中所有字母异位词', link: '/leetcode/sliding-window/438' },
          ],
        },
        {
          text: '子串',
          items: [
            { text: '560. 和为K的子数组', link: '/leetcode/substring/560' },
            { text: '239. 滑动窗口最大值', link: '/leetcode/substring/239' },
            { text: '76. 最小覆盖子串', link: '/leetcode/substring/76' },
          ],
        },
        {
          text: '普通数组',
          items: [
            { text: '53. 最大子数组和', link: '/leetcode/array/53' },
            { text: '56. 合并区间', link: '/leetcode/array/56' },
            { text: '189. 轮转数组', link: '/leetcode/array/189' },
            { text: '238. 除自身以外数组的乘积', link: '/leetcode/array/238' },
            { text: '41. 缺失的第一个正数', link: '/leetcode/array/41' },
          ],
        },
        {
          text: '矩阵',
          items: [
            { text: '73. 矩阵置零', link: '/leetcode/matrix/73' },
            { text: '54. 螺旋矩阵', link: '/leetcode/matrix/54' },
            { text: '48. 旋转图像', link: '/leetcode/matrix/48' },
            { text: '240. 搜索二维矩阵II', link: '/leetcode/matrix/240' },
          ],
        },
        {
          text: '链表',
          items: [
            { text: '160. 相交链表', link: '/leetcode/linked-list/160' },
            { text: '206. 反转链表', link: '/leetcode/linked-list/206' },
            { text: '234. 回文链表', link: '/leetcode/linked-list/234' },
            { text: '141. 环形链表', link: '/leetcode/linked-list/141' },
            { text: '142. 环形链表II', link: '/leetcode/linked-list/142' },
            { text: '21. 合并两个有序链表', link: '/leetcode/linked-list/21' },
            { text: '2. 两数相加', link: '/leetcode/linked-list/2' },
            { text: '19. 删除链表的倒数第N个结点', link: '/leetcode/linked-list/19' },
            { text: '24. 两两交换链表中的节点', link: '/leetcode/linked-list/24' },
            { text: '25. K个一组翻转链表', link: '/leetcode/linked-list/25' },
            { text: '138. 随机链表的复制', link: '/leetcode/linked-list/138' },
            { text: '23. 合并K个升序链表', link: '/leetcode/linked-list/23' },
            { text: '146. LRU缓存', link: '/leetcode/linked-list/146' },
            { text: '148. 排序链表', link: '/leetcode/linked-list/148' },
          ],
        },
        {
          text: '二叉树',
          items: [
            { text: '94. 二叉树的中序遍历', link: '/leetcode/binary-tree/94' },
            { text: '104. 二叉树的最大深度', link: '/leetcode/binary-tree/104' },
            { text: '226. 翻转二叉树', link: '/leetcode/binary-tree/226' },
            { text: '101. 对称二叉树', link: '/leetcode/binary-tree/101' },
            { text: '543. 二叉树的直径', link: '/leetcode/binary-tree/543' },
            { text: '102. 二叉树的层序遍历', link: '/leetcode/binary-tree/102' },
            { text: '108. 将有序数组转换为二叉搜索树', link: '/leetcode/binary-tree/108' },
            { text: '98. 验证二叉搜索树', link: '/leetcode/binary-tree/98' },
            { text: '230. 二叉搜索树中第K小的元素', link: '/leetcode/binary-tree/230' },
            { text: '199. 二叉树的右视图', link: '/leetcode/binary-tree/199' },
            { text: '114. 二叉树展开为链表', link: '/leetcode/binary-tree/114' },
            { text: '105. 从前序与中序遍历序列构造二叉树', link: '/leetcode/binary-tree/105' },
            { text: '437. 路径总和III', link: '/leetcode/binary-tree/437' },
            { text: '236. 二叉树的最近公共祖先', link: '/leetcode/binary-tree/236' },
            { text: '124. 二叉树中的最大路径和', link: '/leetcode/binary-tree/124' },
          ],
        },
        {
          text: '图论',
          items: [
            { text: '200. 岛屿数量', link: '/leetcode/graph/200' },
            { text: '994. 腐烂的橘子', link: '/leetcode/graph/994' },
            { text: '207. 课程表', link: '/leetcode/graph/207' },
            { text: '208. 实现Trie前缀树', link: '/leetcode/graph/208' },
          ],
        },
        {
          text: '回溯',
          items: [
            { text: '46. 全排列', link: '/leetcode/backtracking/46' },
            { text: '78. 子集', link: '/leetcode/backtracking/78' },
            { text: '17. 电话号码的字母组合', link: '/leetcode/backtracking/17' },
            { text: '39. 组合总和', link: '/leetcode/backtracking/39' },
            { text: '22. 括号生成', link: '/leetcode/backtracking/22' },
            { text: '79. 单词搜索', link: '/leetcode/backtracking/79' },
            { text: '131. 分割回文串', link: '/leetcode/backtracking/131' },
            { text: '51. N皇后', link: '/leetcode/backtracking/51' },
          ],
        },
        {
          text: '二分查找',
          items: [
            { text: '35. 搜索插入位置', link: '/leetcode/binary-search/35' },
            { text: '74. 搜索二维矩阵', link: '/leetcode/binary-search/74' },
            { text: '34. 在排序数组中查找元素的第一和最后位置', link: '/leetcode/binary-search/34' },
            { text: '33. 搜索旋转排序数组', link: '/leetcode/binary-search/33' },
            { text: '153. 寻找旋转排序数组中的最小值', link: '/leetcode/binary-search/153' },
            { text: '4. 寻找两个正序数组的中位数', link: '/leetcode/binary-search/4' },
          ],
        },
        {
          text: '栈',
          items: [
            { text: '20. 有效的括号', link: '/leetcode/stack/20' },
            { text: '155. 最小栈', link: '/leetcode/stack/155' },
            { text: '394. 字符串解码', link: '/leetcode/stack/394' },
            { text: '84. 柱状图中最大的矩形', link: '/leetcode/stack/84' },
            { text: '739. 每日温度', link: '/leetcode/stack/739' },
          ],
        },
        {
          text: '堆',
          items: [
            { text: '215. 数组中的第K个最大元素', link: '/leetcode/heap/215' },
            { text: '347. 前K个高频元素', link: '/leetcode/heap/347' },
            { text: '295. 数据流的中位数', link: '/leetcode/heap/295' },
          ],
        },
        {
          text: '贪心',
          items: [
            { text: '121. 买卖股票的最佳时机', link: '/leetcode/greedy/121' },
            { text: '55. 跳跃游戏', link: '/leetcode/greedy/55' },
            { text: '45. 跳跃游戏II', link: '/leetcode/greedy/45' },
            { text: '763. 划分字母区间', link: '/leetcode/greedy/763' },
          ],
        },
        {
          text: '动态规划',
          items: [
            { text: '70. 爬楼梯', link: '/leetcode/dp/70' },
            { text: '118. 杨辉三角', link: '/leetcode/dp/118' },
            { text: '198. 打家劫舍', link: '/leetcode/dp/198' },
            { text: '279. 完全平方数', link: '/leetcode/dp/279' },
            { text: '322. 零钱兑换', link: '/leetcode/dp/322' },
            { text: '139. 单词拆分', link: '/leetcode/dp/139' },
            { text: '300. 最长递增子序列', link: '/leetcode/dp/300' },
            { text: '152. 乘积最大子数组', link: '/leetcode/dp/152' },
            { text: '416. 分割等和子集', link: '/leetcode/dp/416' },
            { text: '32. 最长有效括号', link: '/leetcode/dp/32' },
            { text: '62. 不同路径', link: '/leetcode/dp/62' },
            { text: '64. 最小路径和', link: '/leetcode/dp/64' },
            { text: '5. 最长回文子串', link: '/leetcode/dp/5' },
            { text: '1143. 最长公共子序列', link: '/leetcode/dp/1143' },
            { text: '72. 编辑距离', link: '/leetcode/dp/72' },
          ],
        },
        {
          text: '技巧',
          items: [
            { text: '136. 只出现一次的数字', link: '/leetcode/tricks/136' },
            { text: '169. 多数元素', link: '/leetcode/tricks/169' },
            { text: '75. 颜色分类', link: '/leetcode/tricks/75' },
            { text: '31. 下一个排列', link: '/leetcode/tricks/31' },
            { text: '287. 寻找重复数', link: '/leetcode/tricks/287' },
          ],
        },
        {
          text: 'Hot100 外高频扩展',
          collapsed: false,
          items: [
            { text: '88. 合并两个有序数组', link: '/leetcode/hot100-extension/88' },
          ],
        },
      ],
    },

      // ==================== 面试专题 ====================
      '/interview/': [
        {
          text: '面试高频 100 题',
          collapsed: false,
          items: [
            { text: '专题导读', link: '/interview/' },
          ],
        },
      ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Xstly1014/intern' },
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
            },
          },
        },
      },
    },

    footer: {
      message: '基于 VitePress 构建',
      copyright: 'MIT Licensed',
    },
  },
})
