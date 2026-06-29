import { z } from 'zod';
import type { Template, ColorPalette, FontConfig, DecorationConfig, TemplateId } from '../types.js';

export const ColorPaletteSchema = z.object({
  primary: z.string().regex(/^[0-9A-Fa-f]{6}$/, 'hex color (6 chars, no #)'),
  secondary: z.string().regex(/^[0-9A-Fa-f]{6}$/, 'hex color'),
  accent: z.string().regex(/^[0-9A-Fa-f]{6}$/, 'hex color'),
  text: z.string().regex(/^[0-9A-Fa-f]{6}$/, 'hex color'),
  textSecondary: z.string().regex(/^[0-9A-Fa-f]{6}$/, 'hex color'),
  background: z.string().regex(/^[0-9A-Fa-f]{6}$/, 'hex color'),
  surface: z.string().regex(/^[0-9A-Fa-f]{6}$/, 'hex color'),
  border: z.string().regex(/^[0-9A-Fa-f]{6}$/, 'hex color')
});

export const FontConfigSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  mono: z.string().min(1),
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
  category: z.enum([
    'brutalist', 'business', 'creative', 'dark', 'dark-mode',
    'education', 'editorial', 'finance', 'glass', 'gradient',
    'medical', 'minimal', 'tech', 'academic'
  ]),
  palette: ColorPaletteSchema,
  fonts: FontConfigSchema,
  decoration: DecorationConfigSchema,
  emoji: z.string(),
  preview: z.string().optional(),
  extends: z.string().optional()
});

export type TemplateValidated = z.infer<typeof TemplateSchema>;
export type { Template, ColorPalette, FontConfig, DecorationConfig, TemplateId };
