# CI、不可变制品与软件供应链

CI 的产物不仅是 JAR/镜像，还包括测试证据、依赖清单、来源证明和签名。生产只运行受信流水线生成且策略验证通过的不可变 digest。

## 1. 构建链

![从源码到签名制品的供应链](/architecture/infrastructure-build-supply-chain.svg)

保护分支/签名提交→锁定依赖→隔离构建→测试/扫描→生成 SBOM/provenance→镜像扫描→无密钥/短期签名→不可变 Registry。部署验证签名、来源、环境策略和 digest。

## 2. 可复现与依赖

固定 JDK、构建工具、依赖和基础镜像 digest；使用可信仓库代理、防依赖混淆和校验和。缓存只加速，不跨不可信 PR 暴露 Secret。构建不从互联网任意下载未固定脚本。

## 3. CI 身份与隔离

PR 代码不可信，Fork/第三方 Action 无生产 Secret。Runner 临时、隔离、任务后销毁；通过 OIDC 联邦取得最小短期云权限。保护日志和 Artifact，禁止打印环境全集。

## 4. 测试门禁

快速单元/静态在前，集成/契约/架构/安全随后；性能与灾难验证按风险。Flaky test 有 owner 和修复期限，不能永久重试掩盖。门禁结果和例外版本化、到期。

## 5. SBOM 与漏洞

SBOM 随制品保存，关联直接/传递依赖与许可证。漏洞结合可达性、暴露、利用和 SLA，不只看 CVSS。紧急修复仍走可追踪构建签名，不能手工改生产容器。

## 6. 制品晋级

![同一不可变制品跨环境晋级](/architecture/infrastructure-artifact-promotion.svg)

Build once，dev/staging/prod 只晋级同 digest；环境配置运行注入。重建同 tag 会丢失可证明性。Registry 设置不可变、保留、复制和删除保护。

## 7. 构建平台故障

CI/Registry 故障不影响已运行服务；保留已验证版本和回滚制品。Runner/Registry/签名服务有容量、监控、备份和升级。签名 Key/身份泄露可撤销并定位受影响制品。

## 8. 上线检查

- 构建输入是否固定且来自可信仓库？
- PR/Runner 是否隔离且无长期生产 Secret？
- 制品是否有 SBOM、provenance、签名和不可变 digest？
- 部署是否验证制品策略而非只信 Registry 地址？
- 漏洞/Flaky/例外是否有 owner、SLA 和到期？

下一篇：[部署、灰度与回滚](/architecture/infrastructure/deployment)。
