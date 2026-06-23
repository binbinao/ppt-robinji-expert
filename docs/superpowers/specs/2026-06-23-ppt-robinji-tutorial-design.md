---
title: ppt-robinji 个人教程与打磨清单
date: 2026-06-23
status: approved
spec_for: docs/ppt-robinji-tutorial/
applies_to_skill: ppt-robinji v2.6.0
session_id: 2026-06-23
---

# ppt-robinji 个人教程与打磨清单 — 设计文档

## 摘要

本 spec 解决两个独立的事项：

1. **教程**：在 `docs/ppt-robinji-tutorial/` 下生成一份**个人用**的 ppt-robinji 技能实操教程，覆盖 CLI / 库 / Claude Code skill 三种入口和 4 种 PPT 场景（技术分享 / 投资者路演 / TED / 教学报告）。
2. **打磨清单**：作为教程的附录，列出一份**仅供提纲、不本轮实施**的技能打磨项清单，每条标优先级、工作量、状态、实施位置。

打磨本身是**独立项目**，不在本 spec 的实施范围内；本 spec 只产出教程和打磨清单两份文档。

## 决策记录（来自 brainstorming）

| 维度 | 决策 |
|---|---|
| 目标读者 | 你自己（个人速查 + 进化） |
| 使用场景 | 混合：CLI / 库 import / Claude Code skill 三种都可能 |
| PPT 场景覆盖 | 4 种全做（技术分享 / 路演 / TED / 教学报告） |
| 教程/打磨关系 | 两件独立的事，本轮只写教程 |
| 教程形式 | 分章节多文件 + 一个 README 总入口 |
| 端到端 demo 策略 | 1 个主题（"如何高效学习 AI 技能"）× 4 种结构变体 |
| Skill 状态 | `.codebuddy/skills/ppt-robinji/` 已删，必须重装；教程 03 章给重装流程 |
| 章节方案 | 方案 B（教程分块 + 独立能力速查 + 源码地图） |

## 范围 & 非目标

### 范围（本轮交付）

- 14 个 markdown 文件（README + 13 章 + 1 附录）
- 1 个 demo 目录（4 套 tsx 脚本 + 4 份 .pptx 产物）
- 打磨清单 ≥ 10 条种子项

### 非目标

- 不修改 `ppt-robinji/SKILL.md`
- 不修改 `ppt-robinji/src/` 任何源码
- 不重装 / 不上传 `.codebuddy/skills/ppt-robinji/`
- 不修根目录 `README.md`（属于 POLISH-001，独立项目）
- 不引入新依赖（除 Node.js 自带 / 现有 `ppt-robinji` 包之外）

## 目录骨架

```
docs/ppt-robinji-tutorial/
├── README.md                     # 总入口、状态卡、决策表
├── 01-quickstart-cli.md          # CLI 5 分钟起步
├── 02-quickstart-code.md         # import 调库起步
├── 03-quickstart-skill.md        # Claude Code skill 起步（先重装 SKILL.md）
├── 04-e2e-demo.md                # 端到端 demo：「如何高效学习 AI 技能」× 4 结构
├── 05-slide-types.md             # 14 种 slide 类型速查
├── 06-templates.md               # 16 套模板 + 选型决策表
├── 07-image-services.md          # 6 个图片来源
├── 08-brand-density.md           # 品牌定制 + 密度自适应
├── 09-animation-native.md        # 动画/过渡/原生形状
├── 10-source-conversion.md       # 源文档解析（PDF/DOCX/MD/TXT）
├── 11-audio-a11y-i18n.md         # TTS / A11y / 双语
├── 12-source-map.md              # src/ 目录导览
├── 13-faq-pitfalls.md            # 踩坑记录
├── appendix-skill-polish-todo.md # 打磨清单（独立项目提纲）
└── demos/
    ├── demo-ted.ts
    ├── demo-pitch.ts
    ├── demo-launch.ts
    ├── demo-tutorial.ts
    ├── shared.ts                  # 4 套共享的 topic/audience/duration/brand 等常量
    └── output/                    # 4 份 .pptx 产物（不入 git）
        ├── ted.pptx
        ├── pitch.pptx
        ├── launch.pptx
        └── tutorial.pptx
```

`demos/output/` 加入 `.gitignore`。

## README.md 的"三大块"

### 1. 状态卡（顶部）

- 教程版本：v0.1
- 适用 ppt-robinji：v2.6.0
- 状态：WIP（首版）
- 已知缺口：打磨清单见附录

### 2. 决策表：3 种入口怎么选

| 触发场景 | 走哪条 | 章节 |
|---|---|---|
| 临时起一个 demo PPT、不写代码 | CLI | 01 |
| 集成进自己的项目/工具链 | Code | 02 |
| 跟 Claude 对话让它直接出 | Skill（需先重装） | 03 |
| 想跑通一遍完整流程 | 任一起点 → 04 | 04 |

### 3. 决策表：4 种 PPT 场景怎么选

| 场景 | 模板族 | 结构 | 关键 slide | 关键能力章节 |
|---|---|---|---|---|
| 技术分享 | tech-neon / minimal | ted | kpi / process / timeline | 05, 06, 09 |
| 投资者路演 | business-elegant / gradient | pitch | kpi / comparison / cta | 05, 06, 08 |
| TED 公开演讲 | minimal-paper / creative | ted | cover(hook) / quote / story | 05, 06, 08, 11 |
| 教学/报告 | education / academic | tutorial / report | content / chart | 05, 06, 10, 11 |

### 4. 章节导航

14 个文件超链接 + 一句话摘要。

### 5. 维护约定

每章顶部的统一 frontmatter（见下）。

## 统一契约模板

```yaml
---
topic: <一句话主题>
applies_to: ppt-robinji v2.6.0
last_verified_against: 2026-06-23
estimated_read_minutes: <N>
related: [<其它章节>]
---
```

正文三段式：
1. **适用场景**（1-2 段）
2. **可执行示例**（代码 + 输出说明，命令都可复制粘贴）
3. **踩坑 / 注意**（3-5 条要点）

## 三类内容契约

| 类型 | 适用章节 | 必须包含 | 字数目标 | 互引规则 |
|---|---|---|---|---|
| **起步型** | 01 / 02 / 03 | 「先决条件」「3 步跑通」「成功标准」 | < 1500 字 | 三章互不重复，03 包含"重装 SKILL.md"独立小节 |
| **演练型** | 04 | 「主题」「4 套脚本」「4 个产物」「结构对比表」 | 2000-3000 字 | 自洽，不依赖其它章 |
| **速查型** | 05-11 | 「能力清单」「最简代码」「参数表」「常见组合」 | 1500-2500 字 | 06/07 互引；其它独立可读 |
| **辅助型** | 12 / 13 | 「目录树」「职责矩阵」「FAQ」 | 1500-2500 字 | 12 引用 04-11 章节，13 引用所有 |
| **索引型** | appendix | 「类别清单」「优先级」「工作量估算」 | < 1000 字 | 仅被 README 引用 |

## 04 端到端 demo 的具体契约

- **主题**：「如何高效学习 AI 技能」—— 7 ± 1 页，覆盖 cover/agenda/content(3)/conclusion/thank-you
- **4 套脚本**：放在 `docs/ppt-robinji-tutorial/demos/` 下，文件名 `demo-ted.ts` / `demo-pitch.ts` / `demo-launch.ts` / `demo-tutorial.ts`
- **每套脚本**结构统一：topic/audience/duration/structure/slides/brand 6 个常量 + `run()` 入口
- **4 个产物**：分别落到 `docs/ppt-robinji-tutorial/demos/output/{ted,pitch,launch,tutorial}.pptx`
- **结构对比表**：4 列并排展示 (结构/开篇页/核心页/结尾页)
- **不跑 AI**：默认 `PROVIDER=mock` 出 4 份 mock PPT；跑真实 AI 时改一个 env 即可
- **成功标准**：4 份 PPT 都能用 LibreOffice 打开，主标题、页数、模板都符合预期

## 完成定义（DoD）

教程"完工"必须满足：

1. **14 个文件齐备**（README + 13 章 + 1 附录），frontmatter 完整
2. **3 个 quickstart 可跑通**：在干净环境按步骤执行，每章结尾的"成功标准"全部命中
3. **04 端到端 demo 跑通**：`demos/demo-{ted,pitch,launch,tutorial}.ts` 都能 `tsx` 运行，生成 4 份 .pptx
4. **能力速查与源码一致**：05-11 每章的代码片段在 ppt-robinji v2.6.0 上编译通过（无需真实 AI key）
5. **决策表可用**：README 的 2 张决策表能直接帮读者选入口
6. **打磨清单可独立执行**：appendix 列出 ≥ 10 条打磨项，每条标「优先级 / 工作量 / 触发条件 / 实施位置」

## 撰写顺序

```
Phase 1（骨架）
  README.md       ← 决策表 + 状态卡 + 章节摘要

Phase 2（必跑通 — 阻塞后续）
  01-cli.md
  02-code.md
  03-skill.md     ← 验证方式：跟 Claude 说话看是否接管
  04-e2e-demo.md

Phase 3（速查 — 不阻塞但要可读）
  05-slide-types.md → 11-audio-a11y-i18n.md（按 05→11 顺序，每章独立可写）

Phase 4（辅助 — 等速查完才能写引用）
  12-source-map.md
  13-faq-pitfalls.md

Phase 5（索引）
  appendix-skill-polish-todo.md
```

## 验证机制

- 每章 frontmatter 标 `last_verified_against: 2026-06-23`
- Phase 2 章节（01-04）每章写一个"5 步走通"的最小验证脚本（命令清单），跑通一次后贴上"已通过 YYYY-MM-DD 跑通"
- Phase 3 章节（05-11）的代码片段统一通过 `tsx` 试运行（不连真实 AI）
- Phase 4 章节（12-13）由 Phase 3 完成后定稿

## 附录 — 打磨清单种子项（≥ 10 条）

| ID | 类别 | 标题 | 描述 | 优先级 | 工作量 | 实施位置 |
|---|---|---|---|---|---|---|
| POLISH-001 | docs | 根 README 错放 | 根 README.md 是 opencli-maimai 旧内容，与本仓不符 | P0 | XS | 单独 commit |
| POLISH-002 | skill-installation | `.codebuddy/skills/ppt-robinji/` 副本丢失 | 文档化"从 SKILL.md 重装"流程 | P0 | XS | 文档 |
| POLISH-003 | code | 根 `package.json` 不服务 ppt-robinji | 是否拆 monorepo / 是否在根放 workspace | P1 | S | 单独 PR |
| POLISH-004 | docs | SKILL.md frontmatter description 过长 | Claude Code 推荐 < 1024 字符 | P2 | XS | 单独 commit |
| POLISH-005 | scripts | 14 个文件脚本命名不一致 | test-p1 vs test-p0-integration 等混乱 | P2 | S | 重命名 commit |
| POLISH-006 | code | dist/ 在仓库 | .gitignore 应忽略 | P1 | S | 单独 commit |
| POLISH-007 | code | output/ 大量 .pptx 入仓 | 同上 | P1 | S | 单独 commit |
| POLISH-008 | docs | 27 个 npm script 缺分组 | package.json 加 `// groups` 注释 | P2 | S | 单独 commit |
| POLISH-009 | test | 10 个 AI provider 没集成测试 | 大部分只能 mock 测 | P1 | M | 单独 PR |
| POLISH-010 | docs | 16 套模板无视觉对照图 | 16 张缩略图 + 选型表 | P2 | M | 单独 PR |
| POLISH-011 | scripts | 测试脚本与产物命名没规范 | output/ 里产物名混乱 | P2 | S | 重命名 commit |
| POLISH-012 | code | 没看到 CI 配置 | GitHub Actions 跑测试 + 类型检查 | P1 | M | 单独 PR |

## 风险与开放问题

1. **AI provider 不可用**：04 demo 默认 mock，但若用户想跑真实 AI，需要 1 个 key；教程里只给一行切换说明，不强求
2. **ppt-robinji 持续演进**：v2.6.0 之后若有大改，每章 frontmatter 需更新 `applies_to` 字段
3. **Claude Code skill 重装方式未验证**：03 章给出的"重装 SKILL.md"流程可能需要根据当时环境调整
4. **demos 与源码库版本绑定**：如果用户重装 ppt-robinji 到不同版本，demos 可能需要重跑

## 元信息

- **作者**：brainstorming 会话（2026-06-23）
- **spec 路径**：`docs/superpowers/specs/2026-06-23-ppt-robinji-tutorial-design.md`
- **后续动作**：spec 自审 → 用户审 → writing-plans
