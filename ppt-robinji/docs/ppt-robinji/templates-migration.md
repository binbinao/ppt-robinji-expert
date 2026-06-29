# Template Migration Guide (Phase 1)

> Generated: 2026-06-28 | Status: DRAFT

## Why migrate TS → JSON

Before Phase 1, the 16 built-in templates were hard-coded in `src/pptx/templates/*.ts`. That worked, but had three drawbacks:

1. **Hard to extend** — adding a template meant editing TS files, recompiling, and submitting a PR.
2. **No runtime validation** — a typo in a hex color would only show up when pptxgenjs blew up at render time.
3. **No inheritance** — to create "tech-neon warm version" you'd copy/paste ~50 lines.

Phase 1 fixes all three by moving the data to JSON files, adding zod schemas for runtime validation, and introducing a single `loader` that aggregates everything.

## Where the JSON lives

```
src/pptx/templates/
├── data/                  ← NEW: 10 JSON files, one per category
│   ├── business.json      (2 templates)
│   ├── tech.json          (2)
│   ├── academic.json      (1)
│   ├── creative.json      (2)
│   ├── education.json     (1)
│   ├── medical.json       (1)
│   ├── finance.json       (1)
│   ├── minimal.json       (2)
│   ├── dark.json          (1)
│   └── gradient.json      (3)
├── schema.ts              ← NEW: zod schemas (TemplateSchema etc.)
├── loader.ts              ← NEW: validates + aggregates + builds TEMPLATE_MAP
└── index.ts               ← UPDATED: now re-exports loader output
```

At build time, `tsup` inlines each JSON as a JS module (via `loader: { '.json': 'json' }`), so there's no runtime file I/O.

## How to add a new template

1. Open the appropriate `data/<category>.json` (e.g. `tech.json`).
2. Add a new entry to the array — copy the closest existing template, then change:
   - `id` (kebab-case, unique across all files)
   - `name`, `description`
   - `palette` colors (6-char hex, **no `#` prefix** — pptxgenjs rejects it)
   - `fonts`, `decoration` as needed
3. Run `npm run cli -- templates validate`. You should see `✓ your-id` at the bottom.
4. Run `npm run build` to verify the bundle still produces.

Example — adding `tech-aurora` to `tech.json`:

```json
{
  "id": "tech-aurora",
  "name": "极光科技",
  "description": "紫蓝科技渐变 + 霓虹",
  "category": "tech",
  "emoji": "🌌",
  "palette": {
    "primary": "240046",
    "secondary": "7B2CBF",
    "accent": "00F5FF",
    "text": "FFFFFF",
    "textSecondary": "C77DFF",
    "background": "0A0E27",
    "surface": "1A1F3A",
    "border": "5C7CFA"
  },
  "fonts": {
    "title": "Consolas",
    "body": "Microsoft YaHei",
    "mono": "Consolas",
    "titleSize": 32,
    "bodySize": 16,
    "captionSize": 12
  },
  "decoration": {
    "hasGradient": true,
    "hasPattern": false,
    "hasShadow": true,
    "cornerRadius": 8,
    "titleStyle": "modern",
    "contentStyle": "card"
  }
}
```

## Common pitfalls

- **Hex colors must NOT start with `#`**. The regex is `/^[0-9A-Fa-f]{6}$/`. A leading `#` will fail validation.
- **Mixed case is OK** for hex digits (`1e2761` and `1E2761` both pass).
- **Emoji must be valid UTF-8** — don't escape it as `\u` sequences, use the raw character.
- **Field order matters for readability** but not for validation. Keep the order consistent across files.

## Inheritance (Phase 2 preview)

The `extends` field is accepted by the schema but the loader currently ignores it. Phase 2 will implement deep-merge so that you can write:

```json
{
  "id": "tech-aurora",
  "extends": "tech-neon",
  "palette": { "primary": "240046", ... }
}
```

and inherit all other fields from `tech-neon`.

## Strict mode

By default, `getTemplate('nonexistent')` silently falls back to `business-classic`. To opt into strict mode (throws on missing ID):

```bash
PPT_ROBINJI_STRICT_TEMPLATES=1 npm run cli -- ...
```

or call `getTemplate(id, { strict: true })` directly in code.

## Validation

| Command | Purpose |
|---|---|
| `npm run cli -- templates validate` | Run zod validation on every template |
| `tsx scripts/test-template-loader.ts` | Loader unit tests (counts, fallback, strict) |
| `tsx scripts/test-templates.ts` | E2E: generate a 5-page PPTX for each template |

## Style Families (14 categories, 24 templates)

| Family | Category | Templates | Style intent |
|---|---|---|---|
| Editorial | `editorial` | magazine, newspaper | 杂志/报纸感，衬线字体（Playfair Display / Times New Roman），留白艺术 |
| Brutalist | `brutalist` | mono, poster | 粗野主义，纯黑/原色（红黄蓝绿），等宽字体（Courier New） |
| Dark Mode | `dark-mode` | tech, noir | 现代深色 UI（VSCode 风格）+ 高对比度（电影感） |
| Glass | `glass` | frost, prism | 玻璃拟态，半透明/渐变彩色，大圆角（16-20px） |
| Business | `business` | classic, elegant | 企业汇报，深蓝/灰调 |
| Tech | `tech` | neon, circuit | 赛博霓虹/终端绿 |
| Academic | `academic` | classic | 学院派，米白深蓝 |
| Creative | `creative` | coral, aurora | 暖色撞色/紫蓝渐变 |
| Education | `education` | fresh | 清新课件，天蓝柠檬黄 |
| Medical | `medical` | clean | 医疗专业，白青绿 |
| Finance | `finance` | gold | 金典金融，深绿金色 |
| Minimal | `minimal` | charcoal, paper | 极简留白 |
| Dark | `dark` | midnight | 午夜深蓝 |
| Gradient | `gradient` | ocean, sunset, forest | 海洋/日落/森林渐变 |

**Note on dark-mode vs dark**: They are **separate** categories by design.
- `dark` is "dark blue + light blue accent" (midnight vibe)
- `dark-mode` is "modern dark UI + high contrast" (VSCode/film noir)

**Note on glass vs gradient**: They are visually distinct.
- `gradient` uses `hasGradient=true` (color block gradients)
- `glass` uses `hasPattern=true` + large `cornerRadius` (frosted/translucent feel)
