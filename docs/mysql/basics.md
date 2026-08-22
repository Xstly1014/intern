# 01 · 基础与架构

要搞懂 MySQL 的索引、事务、锁，先得知道**一条 SQL 进入数据库后到底经历了什么**。MySQL 从逻辑上分为 **Server 层**和**存储引擎层**两大块：Server 层负责 SQL 的解析、优化、执行等"通用逻辑"，存储引擎层负责数据真正的"存"和"取"。本章把这条链路从头到尾拆开讲清楚。

## 一、MySQL 分层架构

MySQL 采用分层设计，自上而下分为四层。这种分层让"SQL 逻辑处理"与"数据物理存储"彻底解耦，也是 MySQL 能做到**插件式存储引擎**的根本原因。

<svg viewBox="0 0 720 600" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block" font-family='-apple-system,"PingFang SC","Microsoft YaHei",sans-serif'>
  <defs>
    <marker id="my-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M0,0 L10,5 L0,10 Z" fill="#90a4ae"/>
    </marker>
  </defs>
  <text x="360" y="26" text-anchor="middle" fill="#263238" font-size="17" font-weight="700">MySQL 分层架构</text>

  <!-- ① 连接层 -->
  <rect x="40" y="44" width="640" height="76" rx="12" fill="#e8f5f0" stroke="#3c8772" stroke-width="2"/>
  <text x="60" y="74" fill="#2d6b59" font-size="15" font-weight="700">① 连接层 Connection Layer</text>
  <text x="60" y="98" fill="#607d8b" font-size="12">连接管理 · 身份认证 · 权限预检 · 线程管理 / 线程池</text>

  <path d="M360,120 L360,142" stroke="#90a4ae" stroke-width="1.8" marker-end="url(#my-arrow)"/>

  <!-- ② 服务层 -->
  <rect x="40" y="144" width="640" height="176" rx="12" fill="#ffffff" stroke="#78909c" stroke-width="2"/>
  <text x="60" y="172" fill="#263238" font-size="15" font-weight="700">② 服务层 SQL Layer（Server 层 · 跨引擎通用逻辑）</text>
  <rect x="70" y="196" width="135" height="62" rx="10" fill="#f8faf9" stroke="#b0bec5" stroke-width="1.5"/>
  <text x="137" y="222" text-anchor="middle" fill="#263238" font-size="13" font-weight="600">查询缓存</text>
  <text x="137" y="242" text-anchor="middle" fill="#90a4ae" font-size="11">8.0 已移除</text>
  <rect x="230" y="196" width="135" height="62" rx="10" fill="#f8faf9" stroke="#b0bec5" stroke-width="1.5"/>
  <text x="297" y="222" text-anchor="middle" fill="#263238" font-size="13" font-weight="600">分析器</text>
  <text x="297" y="242" text-anchor="middle" fill="#90a4ae" font-size="11">词法 / 语法分析</text>
  <rect x="390" y="196" width="135" height="62" rx="10" fill="#f8faf9" stroke="#b0bec5" stroke-width="1.5"/>
  <text x="457" y="222" text-anchor="middle" fill="#263238" font-size="13" font-weight="600">优化器</text>
  <text x="457" y="242" text-anchor="middle" fill="#90a4ae" font-size="11">索引 / 执行计划</text>
  <rect x="550" y="196" width="135" height="62" rx="10" fill="#e8f5f0" stroke="#3c8772" stroke-width="2"/>
  <text x="617" y="222" text-anchor="middle" fill="#2d6b59" font-size="13" font-weight="600">执行器</text>
  <text x="617" y="242" text-anchor="middle" fill="#3c8772" font-size="11">调用引擎接口</text>
  <path d="M205,227 L230,227" stroke="#90a4ae" stroke-width="1.6" marker-end="url(#my-arrow)"/>
  <path d="M365,227 L390,227" stroke="#90a4ae" stroke-width="1.6" marker-end="url(#my-arrow)"/>
  <path d="M525,227 L550,227" stroke="#90a4ae" stroke-width="1.6" marker-end="url(#my-arrow)"/>
  <text x="60" y="296" fill="#90a4ae" font-size="12">内置函数、存储过程、触发器、视图等也都在这一层实现</text>

  <path d="M360,320 L360,342" stroke="#90a4ae" stroke-width="1.8" marker-end="url(#my-arrow)"/>

  <!-- ③ 存储引擎层 -->
  <rect x="40" y="344" width="640" height="126" rx="12" fill="#ffffff" stroke="#78909c" stroke-width="2"/>
  <text x="60" y="372" fill="#263238" font-size="15" font-weight="700">③ 存储引擎层（插件式架构 · 负责数据的存储与读取）</text>
  <rect x="90" y="392" width="160" height="54" rx="10" fill="#e8f5f0" stroke="#3c8772" stroke-width="2.5"/>
  <text x="170" y="416" text-anchor="middle" fill="#2d6b59" font-size="14" font-weight="700">InnoDB</text>
  <text x="170" y="434" text-anchor="middle" fill="#3c8772" font-size="11">默认引擎</text>
  <rect x="290" y="392" width="160" height="54" rx="10" fill="#f8faf9" stroke="#b0bec5" stroke-width="1.5"/>
  <text x="370" y="424" text-anchor="middle" fill="#263238" font-size="14" font-weight="600">MyISAM</text>
  <rect x="490" y="392" width="160" height="54" rx="10" fill="#f8faf9" stroke="#b0bec5" stroke-width="1.5"/>
  <text x="570" y="424" text-anchor="middle" fill="#263238" font-size="14" font-weight="600">Memory</text>

  <path d="M360,470 L360,492" stroke="#90a4ae" stroke-width="1.8" marker-end="url(#my-arrow)"/>

  <!-- ④ 文件系统层 -->
  <rect x="40" y="494" width="640" height="76" rx="12" fill="#f8faf9" stroke="#d0e4dd" stroke-width="1.5"/>
  <text x="60" y="524" fill="#263238" font-size="15" font-weight="700">④ 文件系统层</text>
  <text x="60" y="548" fill="#607d8b" font-size="12">数据文件(.ibd) · 日志文件(redo log / binlog) · 配置文件(my.cnf)</text>
</svg>

分层的关键点：

- **Server 层**（①②）与具体存储引擎无关，所有引擎共用同一套 SQL 解析、优化、执行逻辑。
- **存储引擎层**（③）是**插件式**的——同一张库里的不同表，甚至可以分别用 InnoDB 和 MyISAM。引擎之间通过统一的 Handler API 与 Server 层通信。
- **文件系统层**（④）最终把数据、日志、配置落到磁盘。

::: tip 一句话记住
**Server 层管"怎么算"，存储引擎层管"怎么存"。** 后面讲的索引、事务、锁，大多发生在 InnoDB 引擎内部；而 SQL 解析、优化则发生在 Server 层。
:::

## 二、连接器：第一道门

客户端发起连接后，第一个打交道的就是**连接器**，它负责三件事：**建立连接、验证身份、查询权限**。

```
客户端 → TCP 三次握手 → 身份认证(用户名/密码) → 权限查询 → 连接建立完成
```

- **身份认证**：连接器用你输入的用户名和密码去权限表里核对，认证失败就报 `Access denied for user`。
- **权限查询**：认证通过后，连接器会读取该用户此刻拥有的权限，之后这次连接里的所有权限判断，都依赖这份**连接建立时读到的快照**。

::: warning 权限是"连接时"的快照
如果你在连接建立之后，管理员才修改了某用户的权限，**这个已存在的连接不会感知到变化**——因为权限在连接建立时就已经确定了。只有新建连接才会拿到新权限。
:::

### 长连接 vs 短连接

| 维度 | 长连接 | 短连接 |
|---|---|---|
| 连接复用 | 一次连接，多次查询复用 | 每次查询都新建、用完即断 |
| 建立开销 | 只在建连时付出一次 | 每次查询都要重复握手、认证 |
| 内存占用 | 偏高（临时内存挂在连接对象上） | 低（断开即释放） |
| 典型使用 | 应用连接池（HikariCP / Druid） | 偶尔执行一次的脚本 |

生产上几乎都用**长连接 + 连接池**。但长连接有两个要注意的坑：

1. **内存暴涨**：MySQL 在执行过程中申请的临时内存是挂在连接对象上的，**只有连接断开才释放**。长连接攒久了，内存占用会越来越大，甚至被 OOM Kill。解法：定期断开长连接，或执行大查询后主动 `mysql_reset_connection`（5.7+）重置连接资源。
2. **连接数上限**：连接数由 `max_connections` 控制，超过后新连接会被拒绝（`Too many connections`）。连接池要配置合理的最大连接数与超时回收。

## 三、查询缓存：为什么被移除

连接建立后，执行查询语句时会先经过**查询缓存**：MySQL 把 SQL 语句作为 key、查询结果集作为 value 存进内存，命中则直接返回。

听起来很美，但它在 **MySQL 8.0 被彻底移除**了，原因有三：

1. **失效太频繁**：只要某张表发生**任何一次更新**，这张表上的所有查询缓存都会被清空。写多读少的场景下命中率极低。
2. **命中率低**：精确匹配整条 SQL（连空格、大小写都要一致），稍有不同就 miss。
3. **并发瓶颈**：缓存的读写需要加锁，高并发下反而成为性能瓶颈。

::: tip 替代方案
需要缓存时，把它放到**应用层**（如 Redis）去做，粒度更细、可控性更强，这也是现代架构的通用做法。
:::

## 四、分析器：读懂你的 SQL

没有命中缓存，SQL 进入**分析器**，任务是搞清楚"这条语句要做什么"，分两步：

- **词法分析**：把 SQL 字符串拆成一个个 token，识别出关键字（`SELECT`、`FROM`、`WHERE`）、表名、列名。
- **语法分析**：根据词法分析的结果，按 MySQL 语法规则构建**解析树**，判断语句是否合法。

如果语法不对，就会收到那个熟悉的报错：

```
ERROR 1064 (42000): You have an error in your SQL syntax...
```

::: tip 报错时机能帮你定位问题
**语法错误在分析器阶段就报**（还没执行）；而"列不存在""表不存在"这类错误要到执行阶段才报。分清报错发生在哪一层，能帮你快速判断是写错了 SQL 还是数据/结构问题。
:::

## 五、优化器：决定怎么执行

分析器产出的解析树交给**优化器**，它要回答两个核心问题：

1. **用哪个索引**：表里有多个索引时，优化器估算走每个索引的成本，选代价最小的。
2. **join 的连接顺序**：多表关联时，决定先连哪张表、后连哪张表（例如 `join` 的顺序会影响扫描行数）。

优化器基于**成本估算**（Cost-Based Optimizer）做决策：估算需要扫描的行数、是否要回表、是否要临时表/排序等，选它认为"最便宜"的方案。

::: warning 优化器也会"选错"
成本估算依赖统计信息（基数、行数），统计不准时可能选错索引，导致慢查询。这时可以用 `FORCE INDEX` 强制指定索引，或 `ANALYZE TABLE` 刷新统计信息。
:::

## 六、执行器：真正干活

优化器给出执行计划后，轮到**执行器**：

1. **权限校验**：执行前再次确认当前用户对该表有没有操作权限，没有则报 `Access denied`。
2. **调用存储引擎接口**：按执行计划，一行行（或按索引）调用引擎的 Handler 接口取数据。

以一条无索引的查询为例，执行器的逻辑大致是：

```
取第一行 → 判断 ID 是否等于 10 → 是则放入结果集，否则跳过 → 取下一行 …直到表尾
```

这个"逐行扫描"就是**全表扫描**（EXPLAIN 里的 `type=ALL`）。如果有索引，执行器会改为调用索引接口，直接定位目标行，效率高得多。

## 七、一条查询语句的完整链路

把上面串起来，一条 `select * from T where ID = 10;` 的完整旅程如下：

<svg viewBox="0 0 720 600" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block" font-family='-apple-system,"PingFang SC","Microsoft YaHei",sans-serif'>
  <defs>
    <marker id="q-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M0,0 L10,5 L0,10 Z" fill="#3c8772"/>
    </marker>
  </defs>
  <text x="360" y="26" text-anchor="middle" fill="#263238" font-size="17" font-weight="700">select * from T where ID = 10 的执行链路</text>

  <rect x="160" y="44" width="400" height="56" rx="10" fill="#f8faf9" stroke="#b0bec5" stroke-width="1.5"/>
  <text x="360" y="68" text-anchor="middle" fill="#263238" font-size="14" font-weight="600">客户端发起请求</text>
  <text x="360" y="88" text-anchor="middle" fill="#90a4ae" font-size="12">select * from T where ID = 10</text>
  <path d="M360,100 L360,120" stroke="#3c8772" stroke-width="2" marker-end="url(#q-arrow)"/>

  <rect x="160" y="122" width="400" height="56" rx="10" fill="#ffffff" stroke="#78909c" stroke-width="1.8"/>
  <text x="360" y="146" text-anchor="middle" fill="#263238" font-size="14" font-weight="600">连接器</text>
  <text x="360" y="166" text-anchor="middle" fill="#607d8b" font-size="12">验证身份 · 查询并锁定权限</text>
  <path d="M360,178 L360,198" stroke="#3c8772" stroke-width="2" marker-end="url(#q-arrow)"/>

  <rect x="160" y="200" width="400" height="56" rx="10" fill="#f8faf9" stroke="#b0bec5" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="360" y="224" text-anchor="middle" fill="#90a4ae" font-size="14" font-weight="600">查询缓存（8.0 已移除）</text>
  <text x="360" y="244" text-anchor="middle" fill="#b0bec5" font-size="12">命中则直接返回结果</text>
  <path d="M360,256 L360,276" stroke="#3c8772" stroke-width="2" marker-end="url(#q-arrow)"/>

  <rect x="160" y="278" width="400" height="56" rx="10" fill="#ffffff" stroke="#78909c" stroke-width="1.8"/>
  <text x="360" y="302" text-anchor="middle" fill="#263238" font-size="14" font-weight="600">分析器</text>
  <text x="360" y="322" text-anchor="middle" fill="#607d8b" font-size="12">词法分析 · 语法分析 · 构建解析树</text>
  <path d="M360,334 L360,354" stroke="#3c8772" stroke-width="2" marker-end="url(#q-arrow)"/>

  <rect x="160" y="356" width="400" height="56" rx="10" fill="#ffffff" stroke="#78909c" stroke-width="1.8"/>
  <text x="360" y="380" text-anchor="middle" fill="#263238" font-size="14" font-weight="600">优化器</text>
  <text x="360" y="400" text-anchor="middle" fill="#607d8b" font-size="12">选择索引 · 生成最优执行计划</text>
  <path d="M360,412 L360,432" stroke="#3c8772" stroke-width="2" marker-end="url(#q-arrow)"/>

  <rect x="160" y="434" width="400" height="56" rx="10" fill="#ffffff" stroke="#78909c" stroke-width="1.8"/>
  <text x="360" y="458" text-anchor="middle" fill="#263238" font-size="14" font-weight="600">执行器</text>
  <text x="360" y="478" text-anchor="middle" fill="#607d8b" font-size="12">校验权限 · 调用存储引擎接口取数</text>
  <path d="M360,490 L360,510" stroke="#3c8772" stroke-width="2" marker-end="url(#q-arrow)"/>

  <rect x="160" y="512" width="400" height="56" rx="10" fill="#e8f5f0" stroke="#3c8772" stroke-width="2.2"/>
  <text x="360" y="536" text-anchor="middle" fill="#2d6b59" font-size="14" font-weight="700">存储引擎 InnoDB</text>
  <text x="360" y="556" text-anchor="middle" fill="#3c8772" font-size="12">定位并返回 ID = 10 的行</text>
</svg>

查询语句**不写任何日志**（不产生 redo log / binlog），因为它不改变数据。真正涉及日志的是更新语句——下一节展开。

## 八、一条更新语句的完整链路

更新语句比查询复杂得多，因为它要保证**崩溃后可恢复、主从可同步**。以这条语句为例：

```sql
update T set c = c + 1 where ID = 2;
```

它涉及两份关键日志：**redo log**（InnoDB 引擎层的物理日志）和 **binlog**（Server 层的逻辑日志）。

<svg viewBox="0 0 720 560" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block" font-family='-apple-system,"PingFang SC","Microsoft YaHei",sans-serif'>
  <defs>
    <marker id="u-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
      <path d="M0,0 L10,5 L0,10 Z" fill="#3c8772"/>
    </marker>
  </defs>
  <text x="360" y="26" text-anchor="middle" fill="#263238" font-size="17" font-weight="700">update T set c = c + 1 where ID = 2 的执行链路</text>

  <!-- step 1 -->
  <circle cx="80" cy="76" r="16" fill="#3c8772"/>
  <text x="80" y="81" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700">1</text>
  <rect x="110" y="50" width="560" height="52" rx="10" fill="#ffffff" stroke="#78909c" stroke-width="1.8"/>
  <text x="130" y="72" fill="#263238" font-size="13" font-weight="600">执行器调用引擎读取 ID=2 这一行</text>
  <text x="130" y="92" fill="#607d8b" font-size="12">若不在 Buffer Pool，则从磁盘读入内存</text>
  <path d="M80,92 L80,122" stroke="#3c8772" stroke-width="2" marker-end="url(#u-arrow)"/>

  <!-- step 2 -->
  <circle cx="80" cy="150" r="16" fill="#3c8772"/>
  <text x="80" y="155" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700">2</text>
  <rect x="110" y="124" width="560" height="52" rx="10" fill="#ffffff" stroke="#78909c" stroke-width="1.8"/>
  <text x="130" y="146" fill="#263238" font-size="13" font-weight="600">引擎将 c 加 1，更新内存中的数据页</text>
  <text x="130" y="166" fill="#607d8b" font-size="12">此时改动还在内存，尚未落盘</text>
  <path d="M80,166 L80,196" stroke="#3c8772" stroke-width="2" marker-end="url(#u-arrow)"/>

  <!-- step 3 -->
  <circle cx="80" cy="224" r="16" fill="#ef6c00"/>
  <text x="80" y="229" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700">3</text>
  <rect x="110" y="198" width="560" height="52" rx="10" fill="#fff3e0" stroke="#ef6c00" stroke-width="2"/>
  <text x="130" y="220" fill="#e65100" font-size="13" font-weight="700">引擎写 redo log，状态置为 prepare</text>
  <text x="130" y="240" fill="#ef6c00" font-size="12">两阶段提交 · 第一阶段</text>
  <path d="M80,240 L80,270" stroke="#3c8772" stroke-width="2" marker-end="url(#u-arrow)"/>

  <!-- step 4 -->
  <circle cx="80" cy="298" r="16" fill="#1565c0"/>
  <text x="80" y="303" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700">4</text>
  <rect x="110" y="272" width="560" height="52" rx="10" fill="#e3f2fd" stroke="#1565c0" stroke-width="2"/>
  <text x="130" y="294" fill="#0d47a1" font-size="13" font-weight="700">执行器写 binlog 到磁盘</text>
  <text x="130" y="314" fill="#1565c0" font-size="12">Server 层逻辑日志 · 用于主从复制与恢复</text>
  <path d="M80,314 L80,344" stroke="#3c8772" stroke-width="2" marker-end="url(#u-arrow)"/>

  <!-- step 5 -->
  <circle cx="80" cy="372" r="16" fill="#ef6c00"/>
  <text x="80" y="377" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700">5</text>
  <rect x="110" y="346" width="560" height="52" rx="10" fill="#fff3e0" stroke="#ef6c00" stroke-width="2"/>
  <text x="130" y="368" fill="#e65100" font-size="13" font-weight="700">执行器调用引擎提交，redo log 状态改为 commit</text>
  <text x="130" y="388" fill="#ef6c00" font-size="12">两阶段提交 · 第二阶段，事务正式生效</text>

  <!-- bottom note -->
  <rect x="40" y="430" width="640" height="100" rx="12" fill="#f8faf9" stroke="#d0e4dd" stroke-width="1.5"/>
  <text x="60" y="458" fill="#263238" font-size="14" font-weight="700">为什么用"两阶段提交"？</text>
  <text x="60" y="482" fill="#607d8b" font-size="12">让 redo log 与 binlog 保持一致：崩溃恢复时若 binlog 完整则提交，否则回滚。</text>
  <text x="60" y="504" fill="#607d8b" font-size="12">否则可能出现主库已生效、从库重放 binlog 后数据不一致的情况。</text>
</svg>

### 两阶段提交（2PC）

第 3、5 步把 redo log 的写入拆成 **prepare** 和 **commit** 两个阶段，中间夹着第 4 步写 binlog，这就是**两阶段提交**。它解决的核心问题是：**redo log 和 binlog 是两套独立的日志，如何保证它们的状态一致？**

崩溃恢复时的判断逻辑：

| 崩溃时刻 | redo log 状态 | binlog 是否完整 | 恢复动作 |
|---|---|---|---|
| 第 3 步后 | prepare | 否 | 回滚事务 |
| 第 4 步后 | prepare | 是 | 提交事务 |
| 第 5 步后 | commit | 是 | 事务已生效 |

如果不做两阶段提交，假设先写 redo log 再写 binlog，中途崩溃就会出现"主库有这条改动、从库重放 binlog 却没有"的数据不一致。

### redo log vs binlog

| 维度 | redo log | binlog |
|---|---|---|
| 所属层 | InnoDB 引擎层（引擎特有） | Server 层（所有引擎共用） |
| 日志内容 | 物理日志（某页某处改了什么） | 逻辑日志（SQL 语句或行变更） |
| 写入方式 | 循环写，空间固定，写满即覆盖 | 追加写，不覆盖旧文件 |
| 主要用途 | 崩溃恢复（crash-safe） | 主从复制、数据归档恢复 |

::: tip WAL：先写日志，再写数据页
InnoDB 采用 **Write-Ahead Logging**：改动先写进 redo log，内存里的脏页可以稍后再刷盘。这样即使掉电，也能靠 redo log 恢复，**用顺序写日志的低成本，换掉了随机写数据页的高成本**。
:::

## 九、存储引擎对比

| 维度 | InnoDB | MyISAM | Memory |
|---|---|---|---|
| 事务支持 | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| 锁粒度 | 行锁 | 表锁 | 表锁 |
| 外键 | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| MVCC | ✅ 支持 | ❌ 不支持 | ❌ 不支持 |
| 崩溃恢复 | ✅ redo log 保障 | ❌ 较弱 | ❌ 数据在内存，重启即失 |
| 索引类型 | 聚簇索引（数据即索引） | 非聚簇索引 | 支持 Hash 索引 |
| `count(*)` | 需扫描（MVCC 下各行可见性不同） | 存了总行数，O(1) | 快 |
| 典型场景 | 绝大多数 OLTP 业务 | 只读/读多写少的归档 | 临时表、缓存 |

**为什么 InnoDB 成为默认引擎**：它同时提供了**事务、行锁、MVCC、崩溃恢复**这四样高并发 OLTP 系统的刚需能力。MyISAM 虽然 `count(*)` 快、全文索引曾占优，但不支持事务和行锁，一次写操作要锁整张表，无法支撑并发写入，因此从 MySQL 5.5 起被 InnoDB 取代为默认引擎。

## 本章小结

- MySQL 分 **Server 层**（连接、解析、优化、执行）与**存储引擎层**（插件式，负责存取数据），两层通过 Handler API 解耦。
- 一条 SQL 的旅程：**连接器 → 分析器 → 优化器 → 执行器 → 存储引擎**；查询缓存已在 8.0 移除。
- 查询不写日志；**更新语句**靠 **redo log + binlog + 两阶段提交**保证崩溃可恢复、主从一致。
- InnoDB 因**事务、行锁、MVCC、crash-safe**成为默认引擎，是后续索引、事务、锁章节的主角。
