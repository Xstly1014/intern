import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '图解技术',
  description: '图解消息队列、MySQL、Redis 等后端核心技术',
  lastUpdated: true,
  cleanUrls: true,
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
      { text: '消息队列', link: '/mq/', activeMatch: '/mq/' },
      { text: 'MySQL', link: '/mysql/', activeMatch: '/mysql/' },
      { text: 'Redis', link: '/redis/', activeMatch: '/redis/' },
    ],

    sidebar: {
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
            { text: 'Q28 镜像队列', link: '/mq/rabbitmq-core/q28' },
          ],
        },
        {
          text: '第三章 RabbitMQ 高级特性',
          collapsed: false,
          items: [
            { text: 'Q29 生产者确认机制', link: '/mq/rabbitmq-advanced/q29' },
            { text: 'Q30 消费者 ACK 机制', link: '/mq/rabbitmq-advanced/q30' },
            { text: 'Q31 prefetch 控制流控', link: '/mq/rabbitmq-advanced/q31' },
            { text: 'Q32 消息拒绝与 requeue', link: '/mq/rabbitmq-advanced/q32' },
            { text: 'Q33 QoS prefetch 调优', link: '/mq/rabbitmq-advanced/q33' },
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

      // ==================== MySQL（预留） ====================
      '/mysql/': [
        {
          text: 'MySQL',
          collapsed: false,
          items: [
            { text: '敬请期待', link: '/mysql/' },
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
    },

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
