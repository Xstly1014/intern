# 图解技术文档站

基于 VitePress 构建的后端技术知识库，通过 SVG 架构图、流程图、原理说明和工程实践，系统梳理后端开发与分布式系统知识。

## 在线阅读

- [系统架构全景指南](https://xstly1014.github.io/intern/architecture/)
- [消息队列面试高频 100 题](https://xstly1014.github.io/intern/mq/)
- [LeetCode Hot 100](https://xstly1014.github.io/intern/leetcode/)

站点首页：[https://xstly1014.github.io/intern/](https://xstly1014.github.io/intern/)

## 内容目录

- **系统架构全景指南**
  - 系统总览、完整请求链路和架构演进
  - 客户端与边缘层：客户端、DNS、CDN、DDoS、WAF、Bot、负载均衡、TLS、HTTP/2/3、多地域和故障排查
  - API 网关、接入与 BFF、身份安全、业务服务、数据存储、中间件、外部集成、可观测和基础设施
  - 使用独立 SVG 图展示系统边界、组件关系和数据流向
- **消息队列面试高频 100 题**
  - RabbitMQ、Kafka、可靠性、性能、运维和场景实战
- **LeetCode Hot 100**
  - 按题型组织的算法解析、Java 实现与图解

## 本地开发

```bash
npm ci
npm run dev
```

默认开发地址由 VitePress 输出，站点源码位于 `docs/`。

## 构建

```bash
npm run build
```

构建产物生成在 `docs/.vitepress/dist/`。

## 部署

推送到 `main` 分支后，[GitHub Actions](https://github.com/Xstly1014/intern/actions) 会自动执行 `npm ci`、VitePress 生产构建，并部署到 GitHub Pages。

## 技术栈

- VitePress 1.x
- Vue 3
- SVG 架构图与流程图
- GitHub Actions
- GitHub Pages
