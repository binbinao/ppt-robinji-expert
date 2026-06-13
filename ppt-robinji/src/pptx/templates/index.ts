/**
 * PPT 模板注册表
 * 集中导出所有模板
 */

import type { Template, TemplateId } from './types.js';
import { businessTemplates } from './business.js';
import { techTemplates } from './tech.js';
import { academicTemplates } from './academic.js';
import { creativeTemplates } from './creative.js';
import { educationTemplates } from './education.js';
import { medicalTemplates } from './medical.js';
import { financeTemplates } from './finance.js';
import { minimalTemplates } from './minimal.js';
import { darkTemplates } from './dark.js';
import { gradientTemplates } from './gradient.js';

export const ALL_TEMPLATES: Template[] = [
  ...businessTemplates,
  ...techTemplates,
  ...academicTemplates,
  ...creativeTemplates,
  ...educationTemplates,
  ...medicalTemplates,
  ...financeTemplates,
  ...minimalTemplates,
  ...darkTemplates,
  ...gradientTemplates
];

export const TEMPLATE_MAP: { [key: TemplateId]: Template } = ALL_TEMPLATES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as { [key: TemplateId]: Template }
);

export function getTemplate(id: TemplateId): Template {
  return TEMPLATE_MAP[id] || TEMPLATE_MAP['business-classic'];
}

export function getTemplatesByCategory(category: string): Template[] {
  return ALL_TEMPLATES.filter(t => t.category === category);
}

export function getCategories(): string[] {
  return Array.from(new Set(ALL_TEMPLATES.map(t => t.category)));
}

// 兼容旧的 palette 接口
export const DEFAULT_PALETTES = ALL_TEMPLATES.reduce(
  (acc, t) => {
    acc[t.id] = {
      primary: t.palette.primary,
      secondary: t.palette.secondary,
      accent: t.palette.accent,
      text: t.palette.text,
      background: t.palette.background
    };
    return acc;
  },
  {} as { [key: string]: { primary: string; secondary: string; accent: string; text: string; background: string } }
);

export type { Template, ColorPalette, FontConfig, DecorationConfig, TemplateId } from './types.js';
