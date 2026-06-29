import { TemplateSchema } from './schema.js';
import type { Template, ColorPalette } from '../types.js';

// JSON data inlined by tsup at build time
import businessData from './data/business.json';
import techData from './data/tech.json';
import academicData from './data/academic.json';
import creativeData from './data/creative.json';
import educationData from './data/education.json';
import medicalData from './data/medical.json';
import financeData from './data/finance.json';
import minimalData from './data/minimal.json';
import darkData from './data/dark.json';
import gradientData from './data/gradient.json';

const rawDataArrays: unknown[][] = [
  businessData, techData, academicData, creativeData, educationData,
  medicalData, financeData, minimalData, darkData, gradientData
];

function loadAndValidate(data: unknown[]): Template[] {
  const templates: Template[] = [];
  for (const item of data) {
    const result = TemplateSchema.safeParse(item);
    if (result.success) {
      templates.push(result.data as Template);
    } else {
      console.warn(`[ppt-robinji] Template validation failed:`, result.error.issues);
    }
  }
  return templates;
}

export const ALL_TEMPLATES: Template[] = loadAndValidate(rawDataArrays.flat());

export const TEMPLATE_MAP: Record<string, Template> = ALL_TEMPLATES.reduce(
  (acc, t) => { acc[t.id] = t; return acc; }, {} as Record<string, Template>
);

export interface GetTemplateOptions {
  strict?: boolean;
}

export function getTemplate(id: string, options: GetTemplateOptions = {}): Template {
  const t = TEMPLATE_MAP[id];
  if (!t) {
    const isStrict = options.strict || process.env.PPT_ROBINJI_STRICT_TEMPLATES === '1';
    if (isStrict) {
      throw new Error(`Template not found: ${id}`);
    }
    const fallback = TEMPLATE_MAP['business-classic'];
    if (!fallback) {
      throw new Error('Critical: fallback template "business-classic" missing');
    }
    return fallback;
  }
  return t;
}

export function getTemplatesByCategory(category: string): Template[] {
  return ALL_TEMPLATES.filter(t => t.category === category);
}

export function getCategories(): string[] {
  return Array.from(new Set(ALL_TEMPLATES.map(t => t.category)));
}

export const DEFAULT_PALETTES: Record<string, Pick<ColorPalette, 'primary' | 'secondary' | 'accent' | 'text' | 'background'>> =
  ALL_TEMPLATES.reduce((acc, t) => {
    acc[t.id] = {
      primary: t.palette.primary,
      secondary: t.palette.secondary,
      accent: t.palette.accent,
      text: t.palette.text,
      background: t.palette.background
    };
    return acc;
  }, {} as Record<string, Pick<ColorPalette, 'primary' | 'secondary' | 'accent' | 'text' | 'background'>>);
