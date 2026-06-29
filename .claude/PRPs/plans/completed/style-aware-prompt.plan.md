# Plan: Style-aware Prompt (Phase 3)

## Summary

让 AI 在生成大纲时**感知当前模板风格**，把风格关键词（配色 / 字体 / 视觉语气）注入 prompt，使 `GenerateOptions.style` 5 枚举值（professional / creative / minimal / persuasive / academic）**真正驱动视觉**，并自动选到匹配的模板。

## User Story

As a **ppt-robinji 用户**,
I want **用 `--style creative` 时 AI 自动选 Editorial/Brutalist/Glass 等创意风格模板，且 prompt 注入风格关键词**,
So that **口述主题 → 选定 style → 拿到的成稿在视觉上与 style 一致，无需手动选模板**。

## Problem → Solution

**现状**：`GenerateOptions.style` 5 枚举值写进 prompt 但**对最终视觉零影响**（PRD 证据：`src/ai/generator.ts:142` 注入一行但 `SPEECH_PROMPT_PREFIX` 没有"按风格调整"指导）。`SPEECH_PROMPT_PREFIX` 只关心内容方法论，不感知模板。

**目标**：在 AI prompt 中注入 `TEMPLATE_STYLE_CONTEXT`（当前模板的 palette + fonts + decoration + styleKeywords），让 AI 知道"用 tech-neon 时标题应该 futuristic + 短促"、"用 editorial-magazine 时应该长句叙事 + 衬线感"。同时新增 `styleMapping.ts` 把 5 style 枚举值映射到 14 个模板族（每个 style 选 1-3 个候选模板）。

## Metadata

- **Complexity**: **Large**（跨 AI / PPTX / CLI 三层改造 + 需要 prompt 调优）
- **Source PRD**: `.claude/PRPs/prds/ppt-robinji-v3-style-visual-upgrade.prd.md`
- **PRD Phase**: Phase 3 — Style-aware Prompt
- **Estimated Files**: ~6（1 schema 扩 type + 1 新增 styleMapping.ts + 1 generator 改 prompt + 1 speech-methodology 扩规则 + 1 creator 解析 style + 1 test 验证风格感知）

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| **P0** | `src/ai/generator.ts` | 1-200 | 注入点：PREFIX + MIDDLE + SUFFIX 三段拼接逻辑；`SPEECH_PROMPT_PREFIX` 从 speech-methodology.ts 来 |
| **P0** | `src/ai/speech-methodology.ts` | 1-80 | `SPEECH_PROMPT_PREFIX` 文本，需扩"风格感知"段 |
| **P0** | `src/pptx/creator.ts` | 17-53 | `CreatorOptions.template` 解析逻辑；需新增 `style` 字段解析 |
| **P1** | `src/pptx/templates/loader.ts` | 1-79 | 提供 ALL_TEMPLATES 给 styleMapping 查表 |
| **P1** | `src/ai/generator.ts:142` | 142 | 当前 style 注入位置（无视觉效果） |
| **P2** | `src/cli.ts` | 1-50 | CLI `--style` 选项已存在；需确认传递到 generator |

---

## Implementation Plan

### Task 1: 新增 `src/pptx/style-mapping.ts`

定义 5 style → 模板族映射：

```typescript
// style-mapping.ts
import { getTemplatesByCategory } from './templates/loader.js';

export const STYLE_FAMILY_MAP: Record<string, string[]> = {
  professional: ['business', 'tech', 'medical', 'finance'],
  creative:     ['creative', 'editorial', 'brutalist', 'glass'],
  minimal:      ['minimal', 'academic', 'dark'],
  persuasive:   ['gradient', 'dark-mode', 'glass'],  // 视觉冲击
  academic:     ['academic', 'minimal', 'business']  // 严肃
};

export function pickTemplateByStyle(style: string, seed?: number): string {
  const families = STYLE_FAMILY_MAP[style] || ['business'];
  const candidates = families.flatMap(f => getTemplatesByCategory(f));
  if (candidates.length === 0) return 'business-classic';
  // 简单 round-robin 或随机选择
  const idx = seed !== undefined ? seed % candidates.length : 0;
  return candidates[idx].id;
}
```

### Task 2: 扩 `GeneratorOptions.style` 已知枚举的语义注释

### Task 3: 修改 `src/ai/generator.ts` — 注入 `TEMPLATE_STYLE_CONTEXT`

在 PREFIX 和 MIDDLE 之间新增一段：
```typescript
const styleContext = options.style || options.template
  ? `## 当前风格感知
   你正在为「${options.style || 'default'}」风格生成内容。
   配色：${template.palette.primary}（主色）+ ${template.palette.accent}（强调）
   字体：${template.fonts.title}（标题）+ ${template.fonts.body}（正文）
   视觉语气：${template.decoration.titleStyle === 'classic' ? '稳重传统' : ...}
   请确保你的措辞与风格匹配——${...}`
  : '';
```

### Task 4: 扩 `speech-methodology.ts` SPEECH_PROMPT_PREFIX

新增「风格感知」段约 200-300 字，告诉 AI 怎么根据风格调整措辞。

### Task 5: 修改 `src/pptx/creator.ts` — 接受 `style` 字段

```typescript
if (options.style && !options.template) {
  const templateId = pickTemplateByStyle(options.style);
  this.template = getTemplate(templateId);
}
```

### Task 6: 测试

新增 `scripts/test-style-mapping.ts` 验证 5 style 各自能选到候选模板。

---

## Validation

- `npm run build` — pass
- `npm run cli -- validate-templates` — 24 pass (不变)
- `tsx scripts/test-style-mapping.ts` — 5 style 全部映射成功
- A/B 验证：同主题 × 5 style 生成 5 个 PPTX 视觉显著不同（人工 review）

---

## NOT Building

- ❌ **不实现 style → template 完全自动选**（保留 `templateId` 显式覆盖）
- ❌ **不引入 VLM 视觉复核**（Phase 4+ 才有意义）
- ❌ **不动 imageQuery 逻辑**（Phase 4 单独做）

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI prompt 注入后效果不明显（仍输出相同内容） | M | 风格感知失灵 | 多 provider 测试 + A/B 截图 |
| 5 style → 14 模板族映射不直观 | M | 用户困惑 | 提供默认 + 显式 override |
| SPEECH_PROMPT_PREFIX 变长导致 token 增加 | M | AI 成本上升 | 仅在 options.style 非空时注入 |

---

*Generated: 2026-06-29*
*Source PRD: Phase 3 — Style-aware Prompt*
*Confidence Score: 7/10 — AI prompt 调优有不确定性*
