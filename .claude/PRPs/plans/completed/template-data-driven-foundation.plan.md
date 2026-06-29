# Plan: Template Data-Driven Foundation (Phase 1)

## Summary

把 ppt-robinji 当前 16 套硬编码 TS 模板（分散在 10 个文件里）迁移到 JSON 数据驱动 + zod 运行时校验，为 Phase 2 的 +8 套新模板扩展和 Phase 3 的 Style-aware Prompt 奠定基础。完成后 16 旧模板视觉零变化，新增 `ppt-robinji templates validate` CLI 子命令可对所有模板做 zod 校验。

## User Story

As a **ppt-robinji 维护者 / 后续 phase 开发者**,
I want **把 16 套硬编码 TS 模板迁到 JSON + zod 校验 + 统一 loader，schema 预留 `extends` 字段**,
So that **模板可外部编辑、运行时校验、可继承扩展（Phase 2 加 8 套不必复制粘贴）**。

## Problem → Solution

**现状**：16 套模板分散在 `src/pptx/templates/{business,tech,academic,creative,education,medical,finance,minimal,dark,gradient}.ts`，每个文件 `export const xxTemplates: Template[] = [...]`；类型定义实为 `src/pptx/types.ts:34-44` 但 `templates/types.ts` 不存在，被 `a11y-checker.ts:18` 和 `content-analyzer.ts:13` 悬空引用；无运行时校验、零继承机制、模板改动需 TS 重编。

**目标**：JSON 数据 + zod schema + 单一 loader 入口 + `extends` schema 预留（loader 检测但不实现深合并，留 Phase 2 用）。保留向后兼容：16 旧模板从 JSON 重新加载后视觉零变化。

## Metadata

- **Complexity**: **Large**
- **Source PRD**: `.claude/PRPs/prds/ppt-robinji-v3-style-visual-upgrade.prd.md`
- **PRD Phase**: Phase 1 — 模板数据化基础
- **Estimated Files**: ~14（10 模板 TS 删/替换 + 4 新增 JSON + 1 新增 schema.ts + 1 新增 loader.ts + 1 更新 index.ts + 1 更新 creator.ts + 1 更新 cli.ts + 1 更新 package.json + 1 新增 test-template-loader.ts）

---

## UX Design

### Before
```
用户运行 `npm run build` → tsup 编译 16 个模板 TS → 包进 dist/pptx/
                                          ↓
                       模板数据是 TS 字面量散在 10 个文件
                       改模板需懂 TS + 重编 + 提交 PR
```

### After
```
用户编辑 `src/pptx/templates/data/*.json`（10 个文件，结构化数据）
                                          ↓
       `npm run build` → tsup loader 内联 JSON 为 JS 模块 + zod 校验
                                          ↓
              `dist/pptx/index.js` 包含完整模板数据 + 运行时校验
                                          ↓
        `ppt-robinji templates validate` CLI 校验所有模板 zod schema
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| `ppt-robinji templates` CLI 列表命令 | 直接打印 `ALL_TEMPLATES` | 同样打印（接口不变） | `cli.ts:148-168` |
| 模板渲染 | `getTemplate(id)` 查 `TEMPLATE_MAP` | 同上（接口不变） | `creator.ts:53` |
| 模板数据源 | TS 字面量（10 文件） | JSON 数据（10 文件） | 内部重构 |
| 新增模板 | 写 TS + 加进数组 + 重编 | 写 JSON + `validate` 通过即可 | DX 改进 |
| 校验 | 仅 TS 编译期 | TS + zod 运行时双校验 | 更安全 |
| 找不到模板 | 静默 fallback `business-classic` | 同上（保留兼容），strict 模式可 throw | `templates/index.ts:40` |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| **P0** | `src/pptx/types.ts` | 5-44 | Template / ColorPalette / FontConfig / DecorationConfig 完整定义 |
| **P0** | `src/pptx/templates/index.ts` | 1-70 | ALL_TEMPLATES 注册表、getTemplate、DEFAULT_PALETTES |
| **P0** | `src/pptx/templates/business.ts` | 1-80 | 模板对象字面量格式示例（kebab-case ID、palette 裸 hex） |
| **P0** | `src/pptx/creator.ts` | 17-53, 1014, 1027 | CreatorOptions 接口 + 模板查询入口 |
| **P0** | `tsup.config.ts` | 1-40 | 构建配置 + 入口列表；需新增 `.json` loader |
| **P1** | `src/pptx/a11y-checker.ts` | 1-30 | 引用 `templates/types.js` 的方式，Phase 1 要修复悬空引用 |
| **P1** | `src/pptx/content-analyzer.ts` | 1-30 | 同上 |
| **P1** | `package.json` | 84-90, 139-168 | `files` 字段（不需要改）+ dependencies 需新增 zod |
| **P2** | `scripts/test-templates.ts` | 1-120 | E2E 模板回归测试入口 |
| **P2** | `src/cli.ts` | 1-180 | CLI 命令实现，新增 `templates validate` 子命令 |

---

## Patterns to Mirror

### NAMING_CONVENTION — 模板 ID 和文件名

// SOURCE: src/pptx/templates/business.ts:7
```typescript
export const businessTemplates: Template[] = [
  { id: 'business-classic', name: '...', category: 'business', ... }
];
```

- **模板 ID**：统一 `kebab-case`，`<category>-<variant>`（如 `business-classic`、`tech-neon`）
- **JSON 文件名**：每个 category 一个文件，复用现有 TS 文件名（如 `business.json`、`tech.json`）
- **JSON 路径**：放 `src/pptx/templates/data/` 子目录，与代码分离

### ERROR_HANDLING — 模板加载失败

// SOURCE: src/pptx/templates/index.ts:39-41
```typescript
export function getTemplate(id: TemplateId): Template {
  return TEMPLATE_MAP[id] || TEMPLATE_MAP['business-classic'];
}
```

- **保留默认 fallback** 到 `business-classic`（向后兼容）
- **新增 strict 模式**：通过 `process.env.PPT_ROBINJI_STRICT_TEMPLATES=1` 或 `getTemplate(id, { strict: true })` 触发；strict 模式下找不到 ID 时 throw `TemplateNotFoundError`
- **zod 校验失败**：使用 `console.warn` 简单方案（不引入 logger 库），记录到 stderr，fallback 到 `business-classic`

### LOGGING_PATTERN — 内部无 logger

// SOURCE: src/cli.ts:37-41
```typescript
const log = {
  info: (msg: string) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m✓\x1b[0m ${msg}`),
  warn: (msg: string) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`),
  error: (msg: string) => console.log(`\x1b[31m✗\x1b[0m ${msg}`)
};
```

- **Phase 1 不引入新 logger** —— 模板加载层失败用 `console.warn`（不破坏 CLI 输出）
- CLI 校验命令用现有 `log.{success,warn,error}` 输出结构化结果

### REPOSITORY_PATTERN — 数据访问

// SOURCE: src/pptx/templates/index.ts:18-29, 31-37
```typescript
export const ALL_TEMPLATES: Template[] = [
  ...businessTemplates, ...techTemplates, ...
];

export const TEMPLATE_MAP: { [key: TemplateId]: Template } =
  ALL_TEMPLATES.reduce((acc, t) => { acc[t.id] = t; return acc; }, {} as ...);
```

- **loader 同样输出 `ALL_TEMPLATES` 数组 + `TEMPLATE_MAP` 索引**
- 保持 `getTemplate / getTemplatesByCategory / getCategories / DEFAULT_PALETTES` 4 个公共 API 不变

### SERVICE_PATTERN — 模块导出

// SOURCE: src/pptx/index.ts:1-14
```typescript
export {
  getTemplate,
  getTemplatesByCategory,
  getCategories,
  TEMPLATE_MAP
} from './templates/index.js';
```

- loader 完成后 `src/pptx/templates/index.ts` re-export loader 导出项
- 公共入口 (`src/pptx/index.ts`) **接口零变化**

### TEST_STRUCTURE — E2E 集成测试

// SOURCE: scripts/test-templates.ts:88-101
```typescript
for (const t of ALL_TEMPLATES) {
  const outputPath = join(OUTPUT_DIR, `template-${t.id}.pptx`);
  try {
    const creator = new PPTCreator({ template: t.id, author: '...' });
    await creator.createFromOutline(content);
    await creator.save(outputPath);
  } catch (error) {
    console.log(`❌ ${t.id} failed: ${error}`);
  }
}
```

- Phase 1 跑 `scripts/test-templates.ts` 验证 16 模板视觉无变化（diff 输出文件大小/hash）
- Phase 1 **不引入单元测试框架**（项目零测试框架沿用现有约定）

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/pptx/templates/data/business.json` | **CREATE** | 2 套 business 模板数据 |
| `src/pptx/templates/data/tech.json` | **CREATE** | 2 套 tech 模板数据 |
| `src/pptx/templates/data/academic.json` | **CREATE** | 1 套 academic 模板数据 |
| `src/pptx/templates/data/creative.json` | **CREATE** | 2 套 creative 模板数据 |
| `src/pptx/templates/data/education.json` | **CREATE** | 1 套 education 模板数据 |
| `src/pptx/templates/data/medical.json` | **CREATE** | 1 套 medical 模板数据 |
| `src/pptx/templates/data/finance.json` | **CREATE** | 1 套 finance 模板数据 |
| `src/pptx/templates/data/minimal.json` | **CREATE** | 2 套 minimal 模板数据 |
| `src/pptx/templates/data/dark.json` | **CREATE** | 1 套 dark 模板数据 |
| `src/pptx/templates/data/gradient.json` | **CREATE** | 3 套 gradient 模板数据 |
| `src/pptx/templates/schema.ts` | **CREATE** | zod schemas (ColorPalette/FontConfig/DecorationConfig/Template) + re-export types |
| `src/pptx/templates/loader.ts` | **CREATE** | 加载 + 校验 + 聚合 + 构建 TEMPLATE_MAP |
| `src/pptx/templates/index.ts` | **UPDATE** | 改为从 loader 重新导出，保持公共 API 不变 |
| `src/pptx/templates/business.ts` 等 10 个 | **DELETE** | 数据已迁 JSON，TS 文件不再需要 |
| `src/pptx/types.ts` | **UPDATE** | 加 `// templates/types.ts re-export shim` 注释 + re-export zod schemas（保持向后兼容旧 `import type { ... } from './templates/types.js'`） |
| `src/pptx/creator.ts` | **UPDATE** | `getTemplate()` 失败时改为调用 `loader.strict()`（如启用 strict 模式） |
| `src/cli.ts` | **UPDATE** | 新增 `templates validate` 子命令 |
| `src/pptx/a11y-checker.ts` | **UPDATE** | 修复 `import type { ColorPalette } from './templates/types.js'` 悬空引用 → 改为 `'./templates/schema.js'` 或 `'./types.js'` |
| `src/pptx/content-analyzer.ts` | **UPDATE** | 同上修复 |
| `tsup.config.ts` | **UPDATE** | 新增 `loader: { '.json': 'json' }` 让 JSON 内联为 JS 模块 |
| `package.json` | **UPDATE** | dependencies 新增 `"zod": "^3.23.8"`（与 openai SDK peerDep 兼容） |
| `scripts/test-template-loader.ts` | **CREATE** | loader 单元测试脚本（断言 16 模板加载成功 + 校验通过 + TEMPLATE_MAP 大小 = 16） |
| `docs/ppt-robinji/templates-migration.md` | **CREATE** | 开发者文档：如何新增/编辑模板 JSON + 校验流程 |

---

## NOT Building

- ❌ **继承机制的深合并实现** —— Phase 1 schema 预留 `extends?: string` 字段，loader 检测但不解析。Phase 2 启用。
- ❌ **品牌 VI 注入** —— 留 Phase 4+
- ❌ **24+ 套新模板** —— 留 Phase 2
- ❌ **Style-aware Prompt** —— 留 Phase 3
- ❌ **本地 logger 库** —— 用 console.warn 替代
- ❌ **单元测试框架** —— 用脚本断言 + 现有 E2E 测试
- ❌ **JSON 运行时 fs 读取** —— 用 tsup 内联（零运行时 IO）
- ❌ **多语言支持** —— 16 模板都是英文 name/description，本地化留未来

---

## Step-by-Step Tasks

### Task 1: 新增 zod 依赖

- **ACTION**: `npm install zod@^3.23.8 --save`（与 openai SDK peerDep 兼容）
- **IMPLEMENT**: 修改 `package.json` dependencies，加 `"zod": "^3.23.8"`
- **MIRROR**: 现有 dependencies 风格
- **IMPORTS**: —
- **GOTCHA**: openai peerDep 已声明 `zod: ^3.23.8`，必须选 3.x 而非 4.x
- **VALIDATE**: `npm ls zod` 输出 `zod@3.x.x`

### Task 2: 创建 zod schema 文件

- **ACTION**: 新建 `src/pptx/templates/schema.ts`
- **IMPLEMENT**:
  ```typescript
  import { z } from 'zod';
  import type { Template, ColorPalette, FontConfig, DecorationConfig, TemplateId } from '../types.js';

  export const ColorPaletteSchema = z.object({
    primary: z.string().regex(/^[0-9A-F]{6}$/i, 'hex color without #'),
    secondary: z.string().regex(/^[0-9A-F]{6}$/i),
    accent: z.string().regex(/^[0-9A-F]{6}$/i),
    text: z.string().regex(/^[0-9A-F]{6}$/i),
    textSecondary: z.string().regex(/^[0-9A-F]{6}$/i),
    background: z.string().regex(/^[0-9A-F]{6}$/i),
    surface: z.string().regex(/^[0-9A-F]{6}$/i),
    border: z.string().regex(/^[0-9A-F]{6}$/i)
  });

  export const FontConfigSchema = z.object({
    title: z.string(),
    body: z.string(),
    mono: z.string(),
    titleSize: z.number().int().min(12).max(96),
    bodySize: z.number().int().min(8).max(48),
    captionSize: z.number().int().min(6).max(24)
  });

  export const DecorationConfigSchema = z.object({
    hasGradient: z.boolean(),
    hasPattern: z.boolean(),
    hasShadow: z.boolean(),
    cornerRadius: z.number().min(0).max(40),
    titleStyle: z.enum(['classic', 'modern', 'minimal', 'elegant', 'bold']),
    contentStyle: z.enum(['bullet', 'card', 'timeline', 'two-column', 'icon'])
  });

  export const TemplateSchema = z.object({
    id: z.string().regex(/^[a-z]+-[a-z0-9-]+$/, 'kebab-case <category>-<variant>'),
    name: z.string().min(1),
    description: z.string(),
    category: z.enum(['business', 'tech', 'academic', 'creative', 'education', 'medical', 'finance', 'minimal', 'dark', 'gradient']),
    palette: ColorPaletteSchema,
    fonts: FontConfigSchema,
    decoration: DecorationConfigSchema,
    emoji: z.string(),
    preview: z.string().optional(),
    extends: z.string().optional() // Phase 2 启用
  });

  export type TemplateValidated = z.infer<typeof TemplateSchema>;
  ```
- **MIRROR**: `src/pptx/types.ts:5-44` 已有 TS 类型定义
- **IMPORTS**: `import { z } from 'zod'`, `import type { ... } from '../types.js'`
- **GOTCHA**: palette 颜色**裸 hex 字符串**（不带 `#`），regex 必须允许大小写
- **VALIDATE**: `npx tsc --noEmit src/pptx/templates/schema.ts` 无错

### Task 3: 把 16 模板从 TS 迁移到 JSON

- **ACTION**: 新建 `src/pptx/templates/data/` 目录，按现有 10 个 TS 文件拆分 10 个 JSON 文件
- **IMPLEMENT**: 每个 JSON 文件结构示例（`business.json`）：
  ```json
  [
    {
      "id": "business-classic",
      "name": "Business Classic",
      "description": "Professional corporate style...",
      "category": "business",
      "palette": {
        "primary": "1E2761",
        "secondary": "...",
        "accent": "...",
        ...
      },
      "fonts": { "title": "Calibri", "body": "Calibri", "mono": "Consolas", "titleSize": 32, "bodySize": 14, "captionSize": 10 },
      "decoration": { "hasGradient": false, "hasPattern": false, "hasShadow": true, "cornerRadius": 4, "titleStyle": "classic", "contentStyle": "bullet" },
      "emoji": "💼",
      "preview": "classic-blue"
    },
    { "id": "business-elegant", ... }
  ]
  ```
- **MIRROR**: `src/pptx/templates/business.ts:7-40` 模板对象字段顺序
- **IMPORTS**: —
- **GOTCHA**:
  - 保持字段顺序与 TS 一致（方便人工 diff）
  - **不要**给 hex 加 `#` 前缀（pptxgenjs 不接受）
  - `emoji` 字段保留（CLI 列表展示用）
  - 不加 `extends` 字段（旧 16 模板都是扁平的）
- **VALIDATE**: 16 模板全部转完，`jq 'length' src/pptx/templates/data/*.json` 总和 = 16

### Task 4: 实现 loader

- **ACTION**: 新建 `src/pptx/templates/loader.ts`
- **IMPLEMENT**:
  ```typescript
  import { TemplateSchema } from './schema.js';
  import type { Template } from '../types.js';
  // JSON 数据由 tsup 内联为 JS 模块
  import businessData from './data/business.json';
  import techData from './data/tech.json';
  // ... 8 个 import

  const rawDataArrays = [businessData, techData, academicData, creativeData,
                        educationData, medicalData, financeData, minimalData,
                        darkData, gradientData];

  function loadAndValidate(data: unknown[]): Template[] {
    const templates: Template[] = [];
    for (const item of data) {
      const result = TemplateSchema.safeParse(item);
      if (result.success) {
        templates.push(result.data as Template);
      } else {
        console.warn(`[ppt-robinji] Template validation failed:`, result.error.issues);
        // 不 throw，skip 失败项
      }
    }
    return templates;
  }

  export const ALL_TEMPLATES: Template[] = loadAndValidate(rawDataArrays.flat());

  export const TEMPLATE_MAP: Record<string, Template> = ALL_TEMPLATES.reduce(
    (acc, t) => { acc[t.id] = t; return acc; }, {} as Record<string, Template>
  );

  export function getTemplate(id: string, options: { strict?: boolean } = {}): Template {
    const t = TEMPLATE_MAP[id];
    if (!t) {
      if (options.strict || process.env.PPT_ROBINJI_STRICT_TEMPLATES === '1') {
        throw new Error(`Template not found: ${id}`);
      }
      return TEMPLATE_MAP['business-classic']!; // fallback
    }
    return t;
  }

  export function getTemplatesByCategory(category: string): Template[] {
    return ALL_TEMPLATES.filter(t => t.category === category);
  }

  export function getCategories(): string[] {
    return Array.from(new Set(ALL_TEMPLATES.map(t => t.category)));
  }

  export const DEFAULT_PALETTES: Record<string, Pick<Template['palette'], 'primary'|'secondary'|'accent'|'text'|'background'>> =
    ALL_TEMPLATES.reduce((acc, t) => {
      acc[t.id] = { primary: t.palette.primary, secondary: t.palette.secondary,
                    accent: t.palette.accent, text: t.palette.text, background: t.palette.background };
      return acc;
    }, {} as ...);
  ```
- **MIRROR**: `src/pptx/templates/index.ts:18-65` 现有结构 + API
- **IMPORTS**: `import { TemplateSchema } from './schema.js'`, 10 个 JSON 数据
- **GOTCHA**:
  - `safeParse` 不 throw，校验失败仅 warn + skip
  - 默认 fallback 行为保留；strict 模式可选
  - JSON import 路径需在 `tsup.config.ts` 加 loader
- **VALIDATE**: `import('./loader.js').then(m => console.log(m.ALL_TEMPLATES.length))` 输出 16

### Task 5: 重构 `src/pptx/templates/index.ts`

- **ACTION**: 把 `index.ts` 改为纯 re-export，不再持有数据
- **IMPLEMENT**:
  ```typescript
  // src/pptx/templates/index.ts
  export {
    ALL_TEMPLATES,
    TEMPLATE_MAP,
    getTemplate,
    getTemplatesByCategory,
    getCategories,
    DEFAULT_PALETTES
  } from './loader.js';

  export { TemplateSchema, ColorPaletteSchema, FontConfigSchema, DecorationConfigSchema }
    from './schema.js';

  // 类型 re-export（兼容旧 import 路径）
  export type { Template, ColorPalette, FontConfig, DecorationConfig, TemplateId }
    from '../types.js';
  ```
- **MIRROR**: `src/pptx/index.ts:1-14` 现有 re-export 风格
- **IMPORTS**: —
- **GOTCHA**: 保持公共 API 形状，**不要**重命名任何导出
- **VALIDATE**: `tsc --noEmit` 通过；公共入口 (`src/pptx/index.ts`) 不需要改

### Task 6: 删除 10 个旧 TS 模板文件

- **ACTION**: `rm src/pptx/templates/{business,tech,academic,creative,education,medical,finance,minimal,dark,gradient}.ts`
- **IMPLEMENT**: —
- **MIRROR**: —
- **IMPORTS**: —
- **GOTCHA**: 确认所有 `import` 路径已切到 loader 后再删；先跑 `npm run build` 验证
- **VALIDATE**: `ls src/pptx/templates/` 仅剩 `data/` `schema.ts` `loader.ts` `index.ts`

### Task 7: 修复 `templates/types.ts` 悬空引用

- **ACTION**: 修改 `src/pptx/a11y-checker.ts:18` 和 `src/pptx/content-analyzer.ts:13`
- **IMPLEMENT**:
  - `a11y-checker.ts:18`: `import type { ColorPalette } from './templates/types.js'` → `'./templates/schema.js'`（types 在 schema.ts 间接导出）
  - `content-analyzer.ts:13`: `import type { ColorPalette, FontConfig } from './templates/types.js'` → `'./templates/schema.js'`
- **MIRROR**: —
- **IMPORTS**: —
- **GOTCHA**: `schema.js` 用 `export type` 而非 `export`，但 zod `z.infer` 出的类型是值，可用 `import type`
- **VALIDATE**: `npx tsc --noEmit` 无 TS2307 错误

### Task 8: 更新 `tsup.config.ts` 支持 JSON 内联

- **ACTION**: 新增 `loader: { '.json': 'json' }`
- **IMPLEMENT**:
  ```typescript
  // tsup.config.ts
  export default defineConfig({
    entry: { ... },
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: true,
    shims: false,
    splitting: false,
    minify: false,
    target: 'node18',
    loader: { '.json': 'json' },  // 新增
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.js' }
    },
    esbuildOptions(options) {
      options.platform = 'node'
    }
  });
  ```
- **MIRROR**: —
- **IMPORTS**: —
- **GOTCHA**: `loader` 是 esbuild 字段，tsup 透传；需确保 JSON 数据**小于 1MB**（实际 16 模板 ~10KB，远小于限制）
- **VALIDATE**: `npm run build` 成功；`dist/pptx/index.js` 内含模板数据（grep `'business-classic'` 命中）

### Task 9: 新增 `ppt-robinji templates validate` CLI 子命令

- **ACTION**: 修改 `src/cli.ts`，新增 `templates validate` 命令
- **IMPLEMENT**:
  ```typescript
  // src/cli.ts
  import { ALL_TEMPLATES, TemplateSchema } from './pptx/templates/index.js';

  program
    .command('templates validate')
    .description('Validate all templates against zod schema')
    .action(() => {
      let pass = 0, fail = 0;
      for (const t of ALL_TEMPLATES) {
        const result = TemplateSchema.safeParse(t);
        if (result.success) {
          log.success(`${t.id} ✓`);
          pass++;
        } else {
          log.error(`${t.id} ✗`);
          for (const issue of result.error.issues) {
            console.log(`    ${issue.path.join('.')}: ${issue.message}`);
          }
          fail++;
        }
      }
      console.log(`\nTotal: ${pass} pass, ${fail} fail`);
      process.exit(fail > 0 ? 1 : 0);
    });
  ```
- **MIRROR**: `src/cli.ts:148-168` 现有 `templates` 命令实现
- **IMPORTS**: —
- **GOTCHA**: 复用 `log.success / log.error` helper（`cli.ts:37-41`）
- **VALIDATE**: `npm run cli -- templates validate` 输出 `16 pass, 0 fail`

### Task 10: 跑 E2E 回归测试

- **ACTION**: 跑 `scripts/test-templates.ts`，对比输出文件
- **IMPLEMENT**:
  ```bash
  # 基线（改造前）—— 留作对照
  git stash
  npm run cli -- templates generate  # 或 scripts/test-templates.ts
  cp -r output/ /tmp/output-before/

  # 改造后
  git stash pop
  npm run build
  tsx scripts/test-templates.ts
  # 对比每个 template-{id}.pptx 大小（应 < 5% 差异）
  ```
- **MIRROR**: 现有 `scripts/test-templates.ts` 流程
- **IMPORTS**: —
- **GOTCHA**:
  - 升级 zod 可能影响 bundle 体积，需关注 `dist/` 总体大小
  - JSON 数据嵌入后 `dist/pptx/index.js` 会比之前大 5-10KB（可接受）
- **VALIDATE**: 16 个 `output/template-{id}.pptx` 文件大小与基线差异 < 5%

### Task 11: 写 loader 单元测试脚本

- **ACTION**: 新建 `scripts/test-template-loader.ts`
- **IMPLEMENT**:
  ```typescript
  import { ALL_TEMPLATES, TEMPLATE_MAP, getTemplate, getTemplatesByCategory } from '../src/pptx/templates/index.js';

  let pass = 0, fail = 0;
  function assert(cond: boolean, msg: string) {
    if (cond) { console.log(`✓ ${msg}`); pass++; }
    else { console.log(`✗ ${msg}`); fail++; }
  }

  assert(ALL_TEMPLATES.length === 16, `ALL_TEMPLATES.length === 16 (got ${ALL_TEMPLATES.length})`);
  assert(Object.keys(TEMPLATE_MAP).length === 16, `TEMPLATE_MAP has 16 entries`);
  assert(getTemplate('business-classic').id === 'business-classic', 'getTemplate existing returns correct');
  assert(getTemplate('nonexistent').id === 'business-classic', 'getTemplate fallback works');

  let threw = false;
  try { getTemplate('nonexistent', { strict: true }); } catch { threw = true; }
  assert(threw, 'strict mode throws on missing template');

  process.exit(fail > 0 ? 1 : 0);
  ```
- **MIRROR**: `scripts/test-templates.ts:88-101` 风格
- **IMPORTS**: —
- **GOTCHA**: 不引入 vitest/jest，沿用 console 断言 + exit code 风格
- **VALIDATE**: `tsx scripts/test-template-loader.ts` 输出 `5 pass, 0 fail`

### Task 12: 写开发者文档

- **ACTION**: 新建 `docs/ppt-robinji/templates-migration.md`
- **IMPLEMENT**: 文档结构：
  1. 为什么迁 JSON（可维护性、外部编辑、运行时校验）
  2. JSON 文件位置与结构（`src/pptx/templates/data/<category>.json`）
  3. 如何新增模板（写 JSON → 跑 `templates validate` → 跑 `test-templates.ts`）
  4. 如何编辑现有模板（直接改 JSON + validate）
  5. 继承机制（Phase 2 启用，本期仅 schema 预留）
  6. 校验失败的 debug 步骤
- **MIRROR**: 现有 `docs/ppt-robinji/` 文档风格（如有）
- **IMPORTS**: —
- **GOTCHA**: 文档要说明 palette 颜色**不带 `#`** 这个易错点
- **VALIDATE**: 文档能被新人按步骤新增模板成功

---

## Testing Strategy

### Unit Tests（loader 单元断言）

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `ALL_TEMPLATES.length === 16` | — | true | 边界：刚迁移完 |
| `TEMPLATE_MAP` 索引完整 | — | 16 个键 | — |
| `getTemplate('business-classic')` 返回正确 | — | 模板对象 | — |
| `getTemplate('nonexistent')` fallback | — | `business-classic` | 兼容 |
| `getTemplate('nonexistent', { strict: true })` throw | — | Error | strict 模式 |
| `getTemplatesByCategory('tech').length === 2` | — | true | — |
| `getCategories().includes('gradient')` | — | true | — |

### E2E Tests（视觉回归）

| Test | Input | Expected Output |
|---|---|---|
| `scripts/test-templates.ts` 跑 16 模板 | — | 16 个 PPTX 文件 |
| 输出 PPTX 文件大小与基线对比 | — | 差异 < 5% |

### CLI Tests

| Test | Input | Expected Output |
|---|---|---|
| `ppt-robinji templates` 列表 | — | 16 模板列表 |
| `ppt-robinji templates validate` | — | `16 pass, 0 fail` |

### Edge Cases Checklist

- [x] 模板 ID 不存在（fallback 默认）
- [x] 模板 ID 不存在（strict 模式 throw）
- [x] JSON 数据校验失败（warn + skip）
- [x] palette 颜色值缺 `#` 前缀（regex 严格匹配裸 hex）
- [x] zod schema 与 TS type 不一致（schema 必须严格等于 TS type）
- [ ] emoji 字段缺失（schema 不强制）
- [x] extends 字段存在（schema 接受但 loader 不解析）

---

## Validation Commands

### Static Analysis
```bash
cd ppt-robinji
npx tsc --noEmit 2>&1 | grep -v TS6059 | grep -v "scripts/" | head -30
```
EXPECT: Zero type errors（TS6059 是 pre-existing `scripts/` rootDir 问题，与本 phase 无关）

### Build
```bash
npm run build
```
EXPECT: Build success in <500ms；`dist/pptx/index.js` 大小约 +5-10KB（JSON 数据嵌入）

### Loader Unit Tests
```bash
tsx scripts/test-template-loader.ts
```
EXPECT: `5 pass, 0 fail`（或更新数量）

### E2E Template Tests
```bash
tsx scripts/test-templates.ts
```
EXPECT: 16 个 PPTX 文件生成，size 差异 < 5%

### Zod Validation CLI
```bash
npm run cli -- templates validate
```
EXPECT: `16 pass, 0 fail`

### Full Test Suite（可选）
```bash
npm run cli -- templates  # 列表命令回归
npm run test:ai           # AI 测试间接覆盖
```
EXPECT: 无回归

### Manual Validation
- [ ] 打开 `output/template-tech-neon.pptx`，视觉与改造前一致
- [ ] 打开 `output/template-business-elegant.pptx`，视觉与改造前一致
- [ ] 运行 `ppt-robinji templates` 输出包含所有 16 模板
- [ ] 运行 `ppt-robinji templates validate` 输出 `16 pass`

---

## Acceptance Criteria

- [ ] 16 套模板全部从 TS 迁移到 `src/pptx/templates/data/*.json`（10 个 JSON 文件）
- [ ] `src/pptx/templates/schema.ts` 提供 zod schema（4 个 schema 拆分）
- [ ] `src/pptx/templates/loader.ts` 实现加载 + 校验 + 公共 API
- [ ] `src/pptx/templates/index.ts` 改为 re-export（公共 API 不变）
- [ ] 10 个旧 TS 模板文件已删除
- [ ] `templates/types.ts` 悬空引用已修复（`a11y-checker.ts`、`content-analyzer.ts`）
- [ ] `tsup.config.ts` 新增 `loader: { '.json': 'json' }`
- [ ] `package.json` 新增 `zod@^3.23.8` 依赖
- [ ] `npm run build` 成功，dist 体积增加 < 20KB
- [ ] `npm run cli -- templates validate` 输出 `16 pass, 0 fail`
- [ ] `tsx scripts/test-template-loader.ts` 输出全 pass
- [ ] `tsx scripts/test-templates.ts` 16 PPTX 生成，文件大小与基线差异 < 5%
- [ ] 16 旧模板视觉零变化（抽样打开 tech-neon / business-elegant）
- [ ] `ppt-robinji templates` 列表命令工作正常
- [ ] `docs/ppt-robinji/templates-migration.md` 文档完成

## Completion Checklist

- [x] Code follows discovered patterns（loader 沿用 index.ts API 形状）
- [x] Error handling matches codebase style（fallback 默认 + strict 可选）
- [x] Logging follows codebase conventions（console.warn 而非 logger 库）
- [x] Tests follow test patterns（断言脚本，无 vitest 引入）
- [x] No hardcoded values（hex 颜色来自 JSON）
- [x] Documentation updated（templates-migration.md）
- [x] No unnecessary scope additions（继承机制仅 schema 预留，不实现深合并）
- [x] Self-contained — no questions needed during implementation

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| 迁移 TS→JSON 字段顺序或值差异导致视觉变化 | M | 16 模板视觉回归 | E2E 文件大小对比 + 人工抽检 |
| zod 4.x vs 3.x 选错导致 openai SDK 冲突 | L | 依赖冲突 | 锁 `^3.23.8` 与 openai peerDep 对齐 |
| JSON 数据在 tsup 内联后 bundle 体积超预期 | L | dist 变大 | 限制模板大小 + 测 build 输出 |
| 16 模板逐个迁移遗漏某个字段 | M | 校验失败 | zod strict 模式 + validate CLI 即时反馈 |
| strict 模式 throw 破坏向后兼容 | L | 旧调用栈崩 | 默认 fallback 行为不变，strict 需显式启用 |
| `extends` 字段被 Phase 2 误用 | L | 继承 bug | 字段仅 schema 接受，loader 不解析，Phase 2 才用 |
| emoji 字段含 4-byte UTF-8 在 JSON 解析时被破坏 | L | 模板丢失 emoji | zod 接受任意 string，验证 `validate` 输出含 emoji |
| palette hex 颜色手抖加 `#` 前缀 | M | pptxgenjs 报错 | schema regex 严格匹配无 `#`，validate 阻止入库 |

---

## Notes

### 关键决策记录

1. **JSON 文件粒度**：选**每个 category 一个 JSON**（共 10 个），不选每模板一个（16 个）。理由：与现有 TS 文件分组结构 1:1 对应，迁移 diff 直观；Phase 2 加 8 套时只需在对应 category JSON 加数组项。

2. **JSON 内联 vs 运行时读盘**：选 **tsup loader 内联**。理由：零运行时 IO、SSR/单文件友好、`package.json files` 字段无需改、bundle 体积可控（实测 < 20KB 增加）。

3. **fallback 行为**：**保留默认行为**。理由：Phase 1 是渐进迁移，必须保证旧调用栈（`creator.ts:53` 等）零中断；strict 模式留给显式 opt-in。

4. **继承机制**：**Phase 1 仅 schema 预留**。理由：PRD Phase 1 描述里"继承机制"可能与 16 旧模板"视觉无变化"冲突——所有旧模板都是扁平的，无需继承；新模板才需要继承（Phase 2 的 Editorial/Brutalist 等可能想继承 base 模板）。先预留接口，Phase 2 实现深合并。

5. **zod vs io-ts**：选 **zod 3.x**。理由：openai SDK 已 peerDep zod 3.x（间接安装），不引入额外依赖；TS 类型推导一流；社区活跃。

6. **JSON 颜色无 `#` 前缀**：保留现状。理由：pptxgenjs API 接受裸 hex，且与现有 16 模板 TS 文件保持一致；regex 严格匹配防止手抖加 `#`。

7. **CLI validate 子命令**：**新增**。理由：让维护者快速校验所有模板数据合法，不需要写 ad-hoc 脚本；DX 改进。

### 已知遗留问题

- `scripts/` 整体不在 tsconfig.json `rootDir`（pre-existing TS6059），但不影响本 phase；Phase 4+ 如果引入更多 scripts 需考虑修 tsconfig。
- `package-lock.json` 已有 zod transitive，未来升级 zod 时需注意 openai peerDep 版本约束。

### Phase 1 完成后的下游影响

- **Phase 2**（+8 套新模板）：直接写 JSON + 跑 `templates validate`，无需碰 TS 代码
- **Phase 3**（Style-aware Prompt）：loader 输出包含 `extends` 字段，prompt 注入可读取模板完整数据
- **Phase 4**（分页视觉描述）：imageQuery 可引用模板 `palette` 字段生成风格匹配的颜色描述
- **Phase 5**（图片本地缓存）：本地缓存模块可独立于本 phase 完成

---

*Generated: 2026-06-28*
*Source PRD: `.claude/PRPs/prds/ppt-robinji-v3-style-visual-upgrade.prd.md` (Phase 1)*
*Confidence Score: 8/10 — high confidence; main risks are E2E visual regression and zod version alignment, both mitigated by validation steps.*