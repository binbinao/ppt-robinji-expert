// Phase 1 — Template data-driven foundation
// Re-export loader output; keep public API shape stable.

export {
  ALL_TEMPLATES,
  TEMPLATE_MAP,
  getTemplate,
  getTemplatesByCategory,
  getCategories,
  DEFAULT_PALETTES,
  type GetTemplateOptions
} from './loader.js';

export {
  TemplateSchema,
  ColorPaletteSchema,
  FontConfigSchema,
  DecorationConfigSchema,
  type TemplateValidated
} from './schema.js';

export type { Template, ColorPalette, FontConfig, DecorationConfig, TemplateId } from '../types.js';
