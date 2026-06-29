/**
 * Style-aware template mapping (Phase 3)
 * Maps 5 high-level style enums (GenerateOptions.style) to candidate template
 * families so AI-generated content can pick a visually consistent template.
 */

import { getTemplatesByCategory, getTemplate } from './templates/loader.js';
import type { Template } from './types.js';

/**
 * Each high-level style → list of category families to pick from.
 * Phase 3 default: 1-4 families per style.
 * Order matters: pickTemplateByStyle uses index 0 by default.
 */
export const STYLE_FAMILY_MAP: Record<string, string[]> = {
  professional: ['business', 'tech', 'medical', 'finance'],
  creative:     ['creative', 'editorial', 'brutalist', 'glass'],
  minimal:      ['minimal', 'academic', 'dark'],
  persuasive:   ['gradient', 'dark-mode', 'glass', 'creative'],
  academic:     ['academic', 'minimal', 'business']
};

/**
 * Pick a template ID for a given high-level style.
 * - `seed`: optional deterministic index (for testing or per-topic determinism)
 * - Returns first candidate if no seed provided (deterministic)
 * - Falls back to 'business-classic' if style unknown or no candidates found
 */
export function pickTemplateByStyle(style: string, seed?: number): string {
  const families = STYLE_FAMILY_MAP[style];
  if (!families || families.length === 0) {
    return 'business-classic';
  }

  const candidates: Template[] = families.flatMap(f => getTemplatesByCategory(f));
  if (candidates.length === 0) {
    return 'business-classic';
  }

  const idx = seed !== undefined
    ? Math.abs(seed) % candidates.length
    : 0;
  return candidates[idx].id;
}

/**
 * Resolve a template: if options.template is set, use it directly;
 * otherwise if options.style is set, pick by style.
 * Returns the actual template id used.
 */
export function resolveTemplateId(options: { template?: string; style?: string; seed?: number }): string {
  if (options.template) return options.template;
  if (options.style) return pickTemplateByStyle(options.style, options.seed);
  return 'business-classic';
}

/**
 * Build a style-context string for AI prompt injection.
 * Describes the visual style of the resolved template so the LLM
 * can adapt word choice, tone, and sentence length.
 */
export function buildStyleContext(templateId: string): string {
  const t = getTemplate(templateId);
  if (!t) return '';

  const toneByTitleStyle: Record<string, string> = {
    classic:  '稳重传统',
    modern:   '现代简洁',
    minimal:  '极简克制',
    elegant:  '优雅精致',
    bold:     '大胆冲击'
  };
  const tone = toneByTitleStyle[t.decoration.titleStyle] || '通用';

  return [
    `当前模板：${t.name}（${t.id}）`,
    `主色调：${t.palette.primary} · 强调色：${t.palette.accent}`,
    `标题字体：${t.fonts.title} · 正文字体：${t.fonts.body}`,
    `视觉语气：${tone}`,
    `内容布局：${t.decoration.contentStyle}`
  ].join('；');
}
