# Plan: Phase 6 — 测试与 A/B 验证

## Summary

闭环 PRD 定义的 Success Metrics：跑最终 demo（脚本 `scripts/final-demo.ts` 12 页）验证 imageQuery ≥25 字 + Style-aware Prompt 生效 + 24 模板视觉可分辨。生成盲评样本（5 style × 24 模板）+ 一份 Verification Report 文档（替代"人工盲评"的部分自动化）。

## User Story

As a **ppt-robinji 维护者**,
I want **一键跑完 Phase 1-5 全部成功标准，得到一份可验证的 verification report**,
So that **把 PRD 中"做到什么算成功"的口径变成机器可跑的断言**。

## Problem → Solution

**现状**：PRD 写了 Success Metrics（模板数 / AI 准确率 / imageQuery 字数 / A/B 验证等），但没有自动化脚本验证。`scripts/test-templates.ts` 只跑 16 → 24 模板生成 PPTX，没量化视觉质量。

**目标**：新增 `scripts/verify-success-metrics.ts` 自动跑全套断言（PRD Success Metrics 表格对应）+ 输出一份 `output/verification-report.md` 人类可读报告。

## Metadata

- **Complexity**: **Small**（1 个新脚本 + 1 个报告文件 + 复用现有工具）
- **Source PRD**: Phase 6
- **Estimated Files**: ~2

---

## Implementation Plan

### Task 1: 新增 `scripts/verify-success-metrics.ts`

7 段断言对应 PRD Success Metrics 7 行：

```typescript
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';
import { ALL_TEMPLATES, getTemplatesByCategory } from '../src/pptx/templates/index.js';

interface Metric { name: string; target: string; actual: string; pass: boolean; }

function assert(name: string, cond: boolean, target: string, actual: string): Metric {
  return { name, target, actual, pass: cond };
}

const metrics: Metric[] = [];

// M1: 模板数量 ≥24
metrics.push(assert(
  'Template count ≥ 24 (MVP)',
  ALL_TEMPLATES.length >= 24,
  '≥ 24',
  `= ${ALL_TEMPLATES.length}`
));

// M2: All categories have ≥1 template
const cats = new Set(ALL_TEMPLATES.map(t => t.category));
metrics.push(assert(
  'All 14 categories represented',
  cats.size >= 14,
  '14 categories',
  `${cats.size} categories`
));

// M3: imageQuery 字数（MVP ≥25）—— 跑 mock AI 内容解析
// 用 scripts/final-demo.ts mock 模式输出（无需真 AI）
try {
  const out = execSync('tsx scripts/final-demo.ts 2>&1', { encoding: 'utf-8' });
  const queries = out.match(/"imageQuery":\s*"([^"]+)"/g) || [];
  const avg = queries.reduce((sum, q) => sum + q.replace(/"imageQuery":\s*"/, '').replace(/"$/, '').split(/\s+/).length, 0)
            / Math.max(queries.length, 1);
  metrics.push(assert(
    'imageQuery avg ≥ 25 words (MVP)',
    avg >= 25,
    '≥ 25 words',
    `≈ ${avg.toFixed(1)} words (${queries.length} samples)`
  );
} catch {
  metrics.push(assert('imageQuery avg ≥ 25 words (MVP)', false, '≥ 25', 'skipped (final-demo failed)'));
}

// M4: validate-templates all pass
try {
  const v = execSync('npm run cli -- validate-templates 2>&1', { encoding: 'utf-8' });
  metrics.push(assert(
    'zod validation all pass',
    v.includes('Total: 24 pass, 0 fail') || v.includes('24 pass'),
    '24 pass',
    'see output'
  ));
} catch { metrics.push(assert('zod validation', false, '24 pass', 'FAILED')); }

// M5: build success
try {
  execSync('npm run build 2>&1', { encoding: 'utf-8', stdio: 'pipe' });
  metrics.push(assert('Build success', true, 'success', 'success'));
} catch { metrics.push(assert('Build success', false, 'success', 'FAILED')); }

// M6: 风格 → 模板映射 5 style 全覆盖（Phase 3）
try {
  const { STYLE_FAMILY_MAP } = await import('../src/pptx/style-mapping.js');
  const styles = Object.keys(STYLE_FAMILY_MAP);
  metrics.push(assert(
    '5 styles mapped to template families',
    styles.length === 5,
    '5',
    `${styles.length}: ${styles.join(', ')}`
  ));
} catch { metrics.push(assert('Style mapping', false, '5', 'skipped')); }

// M7: 图片缓存模块可用
try {
  const cache = await import('../src/image/cache.js');
  const k1 = cache.hashKey('test');
  const k2 = cache.hashKey('test');
  metrics.push(assert(
    'Image cache hash deterministic',
    k1 === k2 && k1.length === 16,
    'deterministic + 16 chars',
    `k='${k1}' len=${k1.length}`
  ));
} catch { metrics.push(assert('Image cache', false, 'available', 'FAIL')); }

// 输出 report
const report = generateReport(metrics);
writeFileSync('output/verification-report.md', report);
console.log(report);
process.exit(metrics.every(m => m.pass) ? 0 : 1);
```

### Task 2: 报告格式（generateReport 函数）

```markdown
# ppt-robinji v3 — Verification Report

Generated: <date>
Phase: 1-6 implementation

| # | Metric | Target | Actual | Pass |
|---|--------|--------|--------|------|
| M1 | Template count | ≥ 24 | = 24 | ✓ |
...

## Summary
<pass_count>/<total_count> metrics met

## Next Steps
- [ ] Manual visual diff (5 style × 24 templates = 120 PPTX, sampled by user)
- [ ] A/B image accuracy (Phase 4 / Phase 5 effectiveness)
```

---

## Validation

```bash
tsx scripts/verify-success-metrics.ts  # 期望 0 fail
cat output/verification-report.md       # 报告可读
```

Manual follow-up（脚本**不**能做）：
- A/B 图像准确率人工评分（需要真 AI 输出，对比 Pollinations 图）
- 24 套模板两两对比盲评 ≥4/7 分（需要人工打开 PPTX 截图打分）

---

## NOT Building

- ❌ **不接真 AI 跑**（token 贵 / 慢；本 phase 只验证数据结构正确性）
- ❌ **不接 VLM 视觉复核**（Phase 4 假设已留口子但本 phase 不实现）
- ❌ **不做真人盲评平台**（属人工 follow-up）

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| final-demo.ts 输出格式变了导致正则匹配失败 | L | 报告数据缺失 | 改用 JSON.parse 解析 |
| mock AI 输出不代表真实 AI 行为 | M | 误以为 imageQuery 已达标 | 报告明确标注 "mock data" |

---

*Confidence: 8/10 — 纯验证逻辑，依赖现有工具链*
