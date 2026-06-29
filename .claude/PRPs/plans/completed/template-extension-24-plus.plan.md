# Plan: Template Extension to 24+ Sets (Phase 2)

> **Note**: This plan was generated during the 2026-06-28 session for the
> `feat/template-data-driven-foundation` branch. The full plan body was
> recreated from the implementation that followed it; refer to commit
> `ed6bc50` for the canonical artifact.

## Summary

Extend ppt-robinji template library from 16 → 24 sets by adding 4 new style families
(Editorial / Brutalist / Dark Mode / Glass), each with 2 templates. Also extend
the zod `category` enum, the TS union type, the loader imports, and the unit-test
hardcoded counts.

## What was changed

1. `src/pptx/templates/schema.ts` — `category: z.enum([...])` 10 → 14 values
2. `src/pptx/types.ts` — `Template.category` union 10 → 14 values (kept in lockstep)
3. `src/pptx/templates/loader.ts` — 4 new JSON imports + 4 new entries in `rawDataArrays`
4. `scripts/test-template-loader.ts` — hardcoded `16/16/10` → `24/24/14`; added 8 new
   asserts (4 new category counts + 4 new categories-included)
5. `docs/ppt-robinji/templates-migration.md` — appended "Style Families" table
6. **4 new JSON files** (one per family):
   - `src/pptx/templates/data/editorial.json` — editorial-magazine + editorial-newspaper
   - `src/pptx/templates/data/brutalist.json` — brutalist-mono + brutalist-poster
   - `src/pptx/templates/data/dark-mode.json` — dark-mode-tech + dark-mode-noir
   - `src/pptx/templates/data/glass.json` — glass-frost + glass-prism

## Style family design intent

| Family | Style intent |
|---|---|
| **Editorial** | Vogue / newspaper feel — Playfair Display + Times New Roman serifs, generous whitespace, monochrome with red accent |
| **Brutalist** | Raw / poster — Courier New monospace, primary-color blocks, 0 corner radius, thick borders |
| **Dark Mode** | Modern dark UI — VSCode-style (#1E1E1E + blue accent) and film-noir (#0A0A0A + warm red) |
| **Glass** | Frosted / prismatic — Inter sans-serif, 16-20px corner radius, gradient + pattern + shadow |

## Validation (all passed)

| Check | Result |
|---|---|
| `npm run build` | ✅ pass (186ms) |
| `ppt-robinji validate-templates` | ✅ **24 pass, 0 fail** |
| `tsx scripts/test-template-loader.ts` | ✅ all assertions pass (8 old + 8 new) |
| `npx tsc --noEmit` | ✅ no new errors (TS6059 pre-existing scripts/ rootDir filtered) |

## Explicitly NOT done

- titleStyle enum NOT extended (5 values cover all 8 new templates)
- contentStyle enum NOT extended (no need for magazine/kanban/split)
- `extends` inheritance NOT implemented (still dormant; Phase 3+ will activate)
- No new font library; uses system font names (Playfair Display / Times New Roman / Inter) that pptxgenjs gracefully degrades to Calibri

## Commit

`ed6bc50 feat(templates): add 4 new style families (8 templates) for Phase 2`
