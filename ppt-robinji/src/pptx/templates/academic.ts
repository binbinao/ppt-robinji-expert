/**
 * 学术风模板 - 严谨、清晰、适合学术汇报
 */

import type { Template } from './types.js';

export const academicTemplates: Template[] = [
  {
    id: 'academic-classic',
    name: '学院经典',
    description: '米白背景 + 深蓝点缀，传统学术风',
    category: 'academic',
    emoji: '🎓',
    palette: {
      primary: '1A365D',
      secondary: '718096',
      accent: 'C53030',
      text: 'FFFFFF',
      textSecondary: '4A5568',
      background: 'FAFAF7',
      surface: 'FFFFFF',
      border: 'CBD5E0'
    },
    fonts: {
      title: 'SimSun',
      body: 'SimSun',
      mono: 'Consolas',
      titleSize: 28,
      bodySize: 16,
      captionSize: 11
    },
    decoration: {
      hasGradient: false,
      hasPattern: false,
      hasShadow: false,
      cornerRadius: 0,
      titleStyle: 'classic',
      contentStyle: 'bullet'
    }
  }
];
