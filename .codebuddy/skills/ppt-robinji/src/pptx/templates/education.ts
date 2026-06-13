/**
 * 教学风模板 - 友好、清晰、适合教育课件
 */

import type { Template } from './types.js';

export const educationTemplates: Template[] = [
  {
    id: 'education-fresh',
    name: '清新课件',
    description: '天蓝 + 柠檬黄，活泼友好适合 K12 教学',
    category: 'education',
    emoji: '📚',
    palette: {
      primary: '00A6FB',
      secondary: 'FFC93C',
      accent: 'FF6B6B',
      text: 'FFFFFF',
      textSecondary: '083D77',
      background: 'F8F9FA',
      surface: 'FFFFFF',
      border: 'CED4DA'
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
      mono: 'Consolas',
      titleSize: 30,
      bodySize: 18,
      captionSize: 13
    },
    decoration: {
      hasGradient: false,
      hasPattern: false,
      hasShadow: true,
      cornerRadius: 8,
      titleStyle: 'modern',
      contentStyle: 'bullet'
    }
  }
];
