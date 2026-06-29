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
