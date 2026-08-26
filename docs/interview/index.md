---
title: 面试专题
---

<script setup>
function goTo(url) {
  window.location.replace(url)
}
</script>

# 面试高频 100 题

字节跳动面试官视角 · Java 后端 & Agent 开发方向

涵盖 Redis、MySQL、JVM、分布式系统、消息队列五大模块，每模块 100 道高频面试题，以【面试官】【面试者】对话格式呈现，含架构图与场景分析。

## 特色

- **高频考点**：每模块精选 100 道高频面试题，覆盖核心知识点
- **对话格式**：以【面试官 · 字节跳动】【面试者】的问答形式呈现
- **架构图解**：内嵌 SVG 技术图解，直观理解复杂概念
- **场景实战**：涵盖缓存设计、分布式锁、秒杀系统等真实场景
- **A4 打印友好**：CSS 适配打印格式，便于纸质复习

## 现有专题

<div class="interview-cards">

<div class="interview-card interview-card-redis" @click.prevent.stop="goTo('/intern/interview/redis.html')">
  <div class="interview-card-icon">Redis</div>
  <div class="interview-card-title">Redis 面试高频 100 题</div>
  <div class="interview-card-desc">基础数据结构、持久化、内存管理、高可用集群、缓存问题、分布式锁、性能调优与场景实战</div>
</div>

## 新增 Java 高频专题

<div class="interview-cards">

<a class="interview-card" href="/intern/interview/juc/">
  <div class="interview-card-icon" style="background:#3c8772">JUC</div>
  <div class="interview-card-title">JUC 并发编程面试高频 100 题</div>
  <div class="interview-card-desc">线程、JMM、锁、AQS、CAS、并发容器、线程池、CompletableFuture 与并发实战</div>
</a>

<a class="interview-card" href="/intern/interview/java-basics/">
  <div class="interview-card-icon" style="background:#b56b35">Java</div>
  <div class="interview-card-title">Java 基础面试高频 100 题</div>
  <div class="interview-card-desc">面向对象、String、异常、泛型、反射、IO、时间日期、函数式编程与编码规范</div>
</a>

<a class="interview-card" href="/intern/interview/java-collections/">
  <div class="interview-card-icon" style="background:#5576a8">集合</div>
  <div class="interview-card-title">Java 集合面试高频 100 题</div>
  <div class="interview-card-desc">ArrayList、HashMap、红黑树、Set、并发集合、迭代器、排序和集合选型</div>
</a>

<a class="interview-card" href="/intern/interview/production-troubleshooting/">
  <div class="interview-card-icon" style="background:#a34c55">线上</div>
  <div class="interview-card-title">线上问题排查面试高频 100 题</div>
  <div class="interview-card-desc">CPU、内存、GC、线程、网络、数据库、缓存、消息、容器发布与故障复盘</div>
</a>

</div>

<div class="interview-card interview-card-mysql" @click.prevent.stop="goTo('/intern/interview/mysql.html')">
  <div class="interview-card-icon">MySQL</div>
  <div class="interview-card-title">MySQL 面试高频 100 题</div>
  <div class="interview-card-desc">索引原理、存储引擎、事务隔离、MVCC、锁机制、日志体系、高可用与分库分表</div>
</div>

<div class="interview-card interview-card-jvm" @click.prevent.stop="goTo('/intern/interview/jvm.html')">
  <div class="interview-card-icon">JVM</div>
  <div class="interview-card-title">JVM 热门面试题 100 道</div>
  <div class="interview-card-desc">内存模型、垃圾回收、类加载机制、调优实战、并发与线程安全</div>
</div>

<div class="interview-card interview-card-distributed" @click.prevent.stop="goTo('/intern/interview/distributed.html')">
  <div class="interview-card-icon">分布式</div>
  <div class="interview-card-title">分布式系统热门面试题 100 道</div>
  <div class="interview-card-desc">CAP/BASE、分布式锁、一致性算法、分布式事务、服务治理、限流熔断</div>
</div>

<div class="interview-card interview-card-mq" @click.prevent.stop="goTo('/intern/interview/mq.html')">
  <div class="interview-card-icon">MQ</div>
  <div class="interview-card-title">消息队列面试高频 100 题</div>
  <div class="interview-card-desc">消息可靠性、顺序性、幂等性、堆积处理、选型对比、Kafka/RocketMQ/RabbitMQ 原理</div>
</div>

</div>

<style>
.interview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.interview-card {
  display: block;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.25s ease;
  cursor: pointer;
}

.interview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--vp-c-brand-1);
}

.interview-card-icon {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 6px;
  margin-bottom: 12px;
  color: #fff;
}

.interview-card-redis .interview-card-icon { background: #dc382d; }
.interview-card-mysql .interview-card-icon { background: #4479a1; }
.interview-card-jvm .interview-card-icon { background: #5d8aa8; }
.interview-card-distributed .interview-card-icon { background: #6f42c1; }
.interview-card-mq .interview-card-icon { background: #f5a623; }

.interview-card-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--vp-c-text-1);
}

.interview-card-desc {
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
</style>

