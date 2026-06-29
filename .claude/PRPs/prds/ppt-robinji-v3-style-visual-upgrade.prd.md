# ppt-robinji v3 — 风格与图文并茂专项提升

## Problem Statement

独立开发者做技术分享和产品发布会时，ppt-robinji 当前生成的演示文稿「风格单调、文字太多、图文并茂严重缺乏」——大多数成品是纯色背景 + 顶部色条 + 3-5 个 bullet 列表，配图与文字仅靠位置并排、无视觉融合，AI 不参与选图，远程图片链接（DALL-E 等）1 小时后失效。每次交付都需要数小时手动调整样式与配图。不解决就只能继续在「功能能用但视觉业余」之间妥协。

## Evidence

- **用户原话**：「ppt风格单调，文字太多」「ppt模板少，风格少，图文并茂严重缺乏」。
- **代码库探索（ppt-robinji 当前现状）**：
  - 16 套模板分散在 10 个 TS 文件，全部硬编码（`src/pptx/templates/*.ts`），无继承、无运行时覆盖接口。
  - `GenerateOptions.style` 5 个枚举值写入 prompt 但**对最终视觉零影响**——`SPEECH_PROMPT_PREFIX` 未包含任何风格/版式指导（`src/ai/generator.ts:142`、`src/ai/speech-methodology.ts`）。
  - 配图链路：AI 只生成 `imageQuery` 关键词，**不参与选图**；零质量检查（`src/image/image-service.ts:74-315`）；DALL-E 链接 1 小时过期直接喂给 pptxgenjs。
  - 密度判定只看字数不看语义（`src/pptx/content-analyzer.ts:40-84`）；图文比例 4 种固定 rect 写死。
  - 品牌定制仅 5 个文字字段（`CreatorOptions`），无法注入 VI 色或字体。
- **市场调研（基于训练数据 2026-01）**：
  - 行业把配图准确率从 40% 拉到 70% 的产品都用「分页单独 prompt」。
  - 模板分类**二维化**（行业 × 风格）是趋势。
  - 流行风格：**Editorial / Brutalist / Dark Mode / Glassmorphism** > 渐变/拟物。
  - Assumptions need validation - 调研时 WebSearch 不可用，建议用 chrome-devtools 对 Gamma/AiPPT.cn 模板分类页做截图取证。
- **现状快照（demo 量化）**：
  - `density-mixed-realistic.pptx`（137 KB，tech-neon）：4 页内容，**0/4 内容页配图**。
  - `image-position-right.pptx`（70 KB）：1 页 / 4 bullets / 1 张 800×600 远程图。
  - `mock-ai-business-classic.pptx`（31 KB，12 页 mock）：**0 张图**。

## Proposed Solution

把 ppt-robinji 从「模板硬编码 + AI 只给文本」升级为「**风格数据驱动 + AI 参与视觉决策**」。三大支柱：

1. **模板数据化**：把 16 套硬编码 TS 迁移到 JSON/YAML 数据 + 加载器 + 继承机制；扩到 24+ 套（MVP），引入 Editorial / Brutalist / Dark Mode / Glassmorphism 4 个新风格族。
2. **Style-aware Prompt**：AI 在生成大纲时**感知当前模板风格**，把风格关键词（配色、字体、版式、视觉语气）注入 prompt，让 style 字段真正生效。
3. **AI 配图增强**：每张内容页输出**详细视觉描述**（≥25 字，含风格关键词）作为 imageQuery 注入图源 prompt（Pollinations）；图片下载到**本地缓存**，避免 DALL-E 链接过期失效。

复用现有 `AnimationManager` 后处理钩子、`IMAGE_PROVIDERS` 字典抽象、density 分析逻辑。

## Key Hypothesis

We believe 「**让 AI 在 prompt 阶段感知当前模板风格并对每张幻灯片输出详细视觉描述**」 will 「**让生成稿的图文匹配率从 20% 升到 50%、模板从 16 套扩到 24+ 套、style 选项不再形同虚设**」 for 「**做技术分享和产品发布会的独立开发者**」. We'll know we're right when **(a) 24 套新模板在 demo 中视觉风格可分辨；(b) AI 输出 imageQuery 平均字数 ≥25 且包含模板风格关键词；(c) 12 页 demo 中图与文字相关性人工评分 ≥3.5/5；(d) 导出后 24 小时 PPT 内嵌图仍可访问（本地缓存命中）**。

## What We're NOT Building

- 🟥 **企业 VI 注入 / 客户品牌色字体** — 这次只做风格库扩展，不做品牌注入层。CreatorOptions 仅保留 5 字段。
- 🟥 **数据 dashboard / KPI 仪表盘** — 财报表格、KPI 仪表盘不在本次范围。
- 🟥 **50+ 页咨询/行研长报告** — 本次目标 12-20 页技术分享/产品发布。
- 🟥 **学术答辩 / 论文 citation 规范** — 不做 citation 注入。
- 🟥 **多语言混排（除中英）** — 中英已支持，其它语言暂缓。
- 🟥 **实时协作编辑** — 仍为单用户脚本流程。
- 🟥 **PPT 内嵌动画（v3 之后另议）** — AnimationManager 已就位，但本次不升级动画。

## Success Metrics

| Metric | Target | How Measured |
|---|---|---|
| 模板数量 | 16 → **24+ (MVP)** / **40 (终极)** | 统计 `src/pptx/templates/` 数量 |
| AI 配图准确率 | 20% → **35% (MVP)** / **50% (终极)** | 12 页 demo 人工评分 ≥3.5/5 |
| Style 字段实际生效 | 100% 5 个枚举值视觉可分辨 | A/B 截图对比同一主题 5 风格 |
| imageQuery 平均字数 | ≥25 字，含模板风格关键词 | 解析生成 JSON 字数 + 关键词匹配 |
| 图片链接稳定性 | 导出 24h 后仍可访问 | 导出后 24h 重新打开 PPT 无失效 |
| 单次成稿时间（口述→导出） | <3 分钟（不含 AI 推理） | demo 计时 |
| 视觉风格可分辨度 | 24 套模板两两对比 ≥4/7 分（用户盲评） | 截图配对盲评 |

## Open Questions

- [ ] 是否引入 VLM（如 GPT-4V / Claude Vision）做配图复核？成本 vs 收益（次要复核，仅对 image 类型 slide）
- [ ] 是否引入付费图源（Unsplash+/DALL-E API）？预算 vs 离线能力权衡
- [ ] 模板数据格式用 JSON / YAML / TS？数据驱动后能否保留类型安全（zod 校验 vs TS schema）
- [ ] 分页 prompt 是「整本一次 prompt 后拆」还是「逐张二次 prompt」？后者更准但更慢
- [ ] 新风格族（Editorial/Brutalist/Dark/Glass）的视觉差异度如何衡量？需要专业设计师 review 吗
- [ ] 市场调研时 WebSearch 不可用，部分市场数字基于训练记忆，是否需要浏览器 MCP 截图取证校准

---

## Users & Context

**Primary User**
- **Who**：独立开发者，做技术分享（meetup / 大会 / 内部分享）和产品发布会，1-2 周截止压力
- **Current behavior**：用 ppt-robinji 生成初稿 → 手动调模板/换图 → 数小时调整
- **Trigger**：接到一个 1-2 周后的技术分享或产品发布任务；或看到一个好东西想顺手整理
- **Success state**：口述主题 → 拿到风格和图文都到位的成稿，无需二次手动调整样式

**Job to Be Done**
> 当 "**接到一个技术分享或产品发布任务（一般 1-2 周后要讲）**" 我想 "**用一两句话告诉 ppt-robinji 主题、受众、场合，然后拿到风格和图文都到位的成稿**" 这样我就能 "**把制作时间从几小时压到几分钟，且不需要二次手动调样式**"。

**Non-Users**
- 需要严格企业 VI 注入的甲方 PPT（这次不做品牌注入层）
- 纯数据 dashboard / 财报表格 / KPI 仪表盘
- 50+ 页咨询/行研长报告
- 学术答辩 / 论文 citation 规范展示
- 多语言混排（除中英）

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|---|---|---|
| **Must** | 模板数据化重构（JSON/YAML + loader + 继承机制） | 解锁模板可维护性和扩展性 |
| **Must** | Style-aware Prompt（AI 感知当前模板风格） | 让 style 5 枚举值真正驱动视觉 |
| **Must** | 分页视觉描述注入图源 prompt | 配图准确率从 20%→35% 的核心机制 |
| **Must** | 图片本地缓存 | 解决 DALL-E 链接 1h 过期问题 |
| **Must** | 模板扩到 24+ 套（含 Editorial / Brutalist / Dark Mode / Glass 各 2 套） | 解决"模板少、风格少"痛点 |
| **Must** | Style 字段→模板族映射 | 5 个 style 枚举值对应 5 个风格族 |
| **Should** | 模板继承（base + override） | 16→24+ 模板不必复制粘贴 |
| **Should** | 简单 VLM 复核（可选，仅 image 类型 slide） | 二次保险但有成本 |
| **Should** | 风格关键词自动注入（palette / 字体 / 视觉语气） | prompt 与模板联动 |
| **Could** | 品牌注入最简版（用户自定义 palette） | 暂缓，留 v4 |
| **Could** | 付费图源接入（Unsplash+ / DALL-E） | 保留接入点但默认关闭 |
| **Could** | 24→40 套扩终极版 | MVP 后追加 |
| **Won't** | 完整企业 VI 注入 | 明确出范围 |
| **Won't** | 实时协作编辑 | 单用户脚本流程不变 |
| **Won't** | 多语言（除中英） | 暂缓 |
| **Won't** | PPT 内嵌动画升级 | AnimationManager 已就位，本次不动 |

### MVP Scope

**MVP = Must 全部 7 项**：模板数据化、Style-aware Prompt、分页描述、本地缓存、24+ 套扩、style→族映射。

**MVP 截止信号**：
- 跑一遍 `final-demo.ts`（12 页技术分享主题），生成 PPTX
- 5 个 style 枚举值生成 5 个不同视觉风格的 PPTX
- 配图准确率人工评分 ≥3.5/5（12 页）
- imageQuery 平均字数 ≥25

### User Flow（口述→成稿关键路径）

```
[口述主题] → "我想做一场关于 [主题] 的技术分享，面向 [受众]，风格想要 [style]"
            ↓
   [AI 生成大纲 + 分页视觉描述]
            ↓
   [自动选模板：基于 style 字段 → 模板族 → 具体模板]
            ↓
   [图片本地缓存：从 Pollinations / Picsum 拉图，存到 ./output/.cache/]
            ↓
   [生成 PPTX：模板参数注入 + AI 内容注入 + 风格关键词注入 image]
            ↓
   [导出成稿] 用户得到 12-15 页技术分享稿
```

**关键节点**：第 3 步的「style → 模板族」映射是 style 字段首次真正生效；第 4 步的本地缓存解决远程图失效。

---

## Technical Approach

**Feasibility**: **HIGH**

**架构现状已就位**：
- `IMAGE_PROVIDERS` 字典（`src/image/providers-config.ts:7-74`）—— 加新图源标准扩展点
- `providers.json` AI 配置外置—— 加 LLM 不改代码
- `AnimationManager.applyAnimations(filePath, configs)`（`src/pptx/creator.ts:998`）—— 后处理 zip 的钩子机制可复用
- `CreatorOptions` options 入口—— 但需新增「pre-render hook」

**架构缺口**：
- 模板硬编码 16 个 TS 文件 → 需迁移到数据驱动
- `GenerateOptions.style` 5 枚举值无视觉映射 → 需新增映射层
- AI 不参与选图 → 需重做 `image-service` 链路
- 远程图失效 → 需新增本地缓存层

**Architecture Notes**

- **数据格式**：JSON + zod schema 校验（保留类型安全 + 易外部编辑）；loader 在编译期跑一次生成 `dist/templates.json`，运行时按需查表。
- **Style→模板族映射**：5 个 style 枚举值（professional / creative / minimal / persuasive / academic）映射到 5 个风格族，每个族 4-8 个具体模板。
- **Prompt 注入点**：`src/ai/generator.ts:140` 拼接 PREFIX 时新增 `TEMPLATE_STYLE_CONTEXT`，注入当前模板的 `palette.primary / fonts.title / decoration.titleStyle / styleKeywords`。
- **分页视觉描述**：`imageQuery` 字段从「2-3 个英文关键词」升级为「≥25 字含风格关键词的视觉描述」，注入到 Pollinations prompt（已有 `options.style` 字段，`src/image/image-service.ts:112`）。
- **本地缓存**：`image-service.ts` 新增 `getOneWithCache()`，URL 解析后下到 `./output/.cache/{hash}.jpg`，下次同 query 命中本地。

**Technical Risks**

| Risk | Likelihood | Mitigation |
|---|---|---|
| 模板数据化丢失 TS 类型安全 | M | zod schema + 编译期校验 |
| 分页 prompt 增加 token 成本 | M | 仅对 image / kpi / timeline 类型 slide 启用 |
| Pollinations 风格控制弱 | M | prompt 强化 + 多关键词注入 + 失败 fallback 到 Picsum |
| 本地缓存目录膨胀 | L | LRU 策略 + max-size 500MB 限制 |
| 16→24 模板视觉风格差异不够明显 | M | 设计 review + A/B 截图盲评 |
| style 5 枚举 → 24 模板的映射粗糙 | M | 允许 `options.templateId` 显式覆盖 style 族 |
| 改造范围大、回归风险 | M | 每阶段保持向后兼容（16 旧模板可继续工作） |

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | 模板数据化基础 | 引入 JSON schema + zod 校验 + loader + 16 旧模板迁移 + 继承机制 | complete | - | - | `.claude/PRPs/plans/template-data-driven-foundation.plan.md` |
| 2 | 模板扩到 24+ 套 | 新增 Editorial / Brutalist / Dark Mode / Glass 各 2 套，共 +8 套 | complete | with 3 | 1 | `.claude/PRPs/plans/template-extension-24-plus.plan.md` (recovered) + commit ed6bc50 |
| 3 | Style-aware Prompt | `generator.ts` 注入 `TEMPLATE_STYLE_CONTEXT`，5 style 枚举值 → 5 风格族映射 | pending | with 2 | 1 | - |
| 4 | 分页视觉描述增强 | AI 输出 `imageQuery` 从关键词升级为 ≥25 字描述，含风格关键词 | pending | - | 3 | - |
| 5 | 图片本地缓存 | `image-service.ts` 新增 `getOneWithCache()`，LRU + max-size | pending | - | 4 | - |
| 6 | 测试与 A/B 验证 | `final-demo.ts` 重跑 12 页；5 style × 24 模板盲评；准确率评分 | pending | - | 2, 3, 4, 5 | - |

### Phase Details

**Phase 1: 模板数据化基础**
- **Goal**：把 16 套硬编码 TS 迁移到 JSON + zod 校验 + 继承机制
- **Scope**：
  - 新增 `templates/*.json`（每套模板一个 JSON）
  - 新增 `src/pptx/templates/schema.ts`（zod schema）
  - 新增 `src/pptx/templates/loader.ts`（编译期/运行期加载）
  - 重构 `src/pptx/templates/index.ts` 改为 loader 调用
  - 新增 `BaseTemplate` + `extends` 字段支持继承
- **Success signal**：`npm run build` 产出相同 dist；16 旧模板视觉无变化

**Phase 2: 模板扩到 24+ 套**
- **Goal**：新增 8 套覆盖 4 个新风格族
- **Scope**：
  - `editorial-magazine.json`（Editorial 风格 1）
  - `editorial-newspaper.json`（Editorial 风格 2）
  - `brutalist-mono.json`（Brutalist 风格 1）
  - `brutalist-poster.json`（Brutalist 风格 2）
  - `dark-mode-tech.json`（Dark Mode 风格 1）
  - `dark-mode-noir.json`（Dark Mode 风格 2）
  - `glass-frost.json`（Glass 风格 1）
  - `glass-prism.json`（Glass 风格 2）
- **Success signal**：24+ 模板在 demo 中两两对比，视觉风格可分辨（≥4/7 盲评）

**Phase 3: Style-aware Prompt**
- **Goal**：让 5 个 style 枚举值真正驱动视觉
- **Scope**：
  - `src/ai/generator.ts` 新增 `TEMPLATE_STYLE_CONTEXT` 注入
  - `src/pptx/style-mapping.ts` 新增（style → 模板族映射）
  - `src/pptx/creator.ts` 接受 style 字段并解析到具体模板 ID
  - `SPEECH_PROMPT_PREFIX` 增补「风格感知」段落
- **Success signal**：同一主题 × 5 style 生成 5 个视觉显著不同的 PPTX

**Phase 4: 分页视觉描述增强**
- **Goal**：AI 输出详细视觉描述替代关键词
- **Scope**：
  - `speech-methodology.ts` 增补「imageQuery 详细描述规则」（≥25 字、含风格关键词）
  - `generator.ts` 验证 imageQuery 字数和关键词
  - `image-service.ts` Pollinations prompt 注入增强后的 imageQuery
- **Success signal**：12 页 demo 中 imageQuery 平均 ≥25 字；配图人工评分 ≥3.5/5

**Phase 5: 图片本地缓存**
- **Goal**：解决远程图（DALL-E / Pollinations）链接过期问题
- **Scope**：
  - `image-service.ts` 新增 `getOneWithCache()` API
  - 新增 `src/image/cache.ts`（LRU + max-size 500MB）
  - CLI / demo 脚本改用 `getOneWithCache`
- **Success signal**：导出 24h 后重新打开 PPT 无失效图

**Phase 6: 测试与 A/B 验证**
- **Goal**：端到端验证 MVP 全部 7 项 Must
- **Scope**：
  - `final-demo.ts` 重跑 12 页技术分享主题
  - 5 style × 5 模板 = 25 个 PPTX 生成（盲评样本）
  - 配图准确率人工评分（≥3.5/5）
  - 24h 后打开 PPT 验证缓存命中
- **Success signal**：所有 Success Metrics 行达标

### Parallelism Notes

- **Phase 2 与 Phase 3 可并行**：Phase 2 是数据/设计工作（不需要 AI 改动），Phase 3 是代码/prompt 工作（不依赖具体模板内容），两者共享的依赖（Phase 1 模板数据化基础）完成后即可并行启动。
- Phase 4 依赖 Phase 3（需 prompt 改造先就位）。
- Phase 5 独立（仅依赖 image-service 接口稳定）。
- Phase 6 串行收尾。

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| 模板数据格式 | **JSON + zod** | YAML / TS / TOML | JSON 工具链成熟、外部易编辑、zod 保留类型安全；TS 硬编码 16 文件已证不可维护 |
| Style 字段 vs 模板 ID | **保留 style 5 枚举 → 模板族** | 纯模板 ID | style 作为「风格族」粗选（5 个），模板 ID 作为「具体呈现」细选（24+）；简化用户心智 |
| 配图增强方案 | **分页详细描述** | 图后选 / VLM 复核 | 分页描述一次到位准确率高；图后选需 VLM 成本高 |
| 图源策略 | **默认 Pollinations + Picsum，付费档可选** | 强制付费 / 强制免费 | 默认免费保证 MVP 可用性；保留 Unsplash+/DALL-E 接入点 |
| 新风格族选型 | **Editorial / Brutalist / Dark / Glass** | 渐变 / 拟物 / 复古 | 市场趋势（2025-2026 主流），避免同质化 |
| 图片缓存策略 | **本地 LRU + max-size 500MB** | 全量 / 不缓存 | 全量磁盘膨胀，不缓存 DALL-E 失效 |
| Style → 模板族映射粒度 | **1 个 style → 1 个族（4-8 模板）** | 多对多 / 单对单 | 单对单最简；用户可用 `templateId` 显式覆盖 |
| 分页 prompt 范围 | **仅 image/kpi/timeline 类型 slide** | 全部 slide | 仅图片相关 slide 需要，控制 token 成本 |

---

## Research Summary

**Market Context**
- 行业把配图准确率从 40% 拉到 70% 的产品都用「**分页单独 prompt**」。
- 模板分类**二维化**（行业 × 风格）是趋势。
- 流行风格优先级：**Editorial / Brutalist / Dark Mode / Glassmorphism** > 渐变/拟物。
- **未完成项**：建议用 chrome-devtools 对 Gamma / AiPPT.cn 模板分类页截图取证，校准模板数量；建立「AI 配图语义错配」反面案例库作为 A/B 测试 baseline。

**Technical Context**
- 现有扩展点：`IMAGE_PROVIDERS` 字典、providers.json AI 配置外置、`AnimationManager` 后处理钩子。
- 架构约束：pptxgenjs 渐变/阴影只能用矩形叠加模拟（`src/pptx/creator.ts:269,856`）；项目已有 `src/pptx/native/` 用 OOXML 直接绕。
- 现状快照：12-15 页、tech-neon 或 business-classic、约 30-50% 页面配 1 张远程图，图文仅位置并排。

---

*Generated: 2026-06-28*
*Status: DRAFT - needs validation*