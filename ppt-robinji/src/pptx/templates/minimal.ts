/**
 * 极简风模板 - 简洁、留白、适合内容为主
 */

import type { Template } from './types.js';

export const minimalTemplates: Template[] = [
  {
    id: 'minimal-charcoal',
    name: '炭灰极简',
    description: '黑白灰，留白艺术',
    category: 'minimal',
    emoji: '⬜',
    palette: {
      primary: '36454F',
      secondary: 'F2F2F2',
      accent: '212121',
      text: '212121',
      textSecondary: '6C757D',
      background: 'F2F2F2',
      surface: 'FFFFFF',
      border: 'DEE2E6'
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
      mono: 'Consolas',
      titleSize: 28,
      bodySize: 16,
      captionSize: 12
    },
    decoration: {
      hasGradient: false,
      hasPattern: false,
      hasShadow: false,
      cornerRadius: 0,
      titleStyle: 'minimal',
      contentStyle: 'bullet'
    }
  },
  {
    id: 'minimal-paper',
    name: '纸本质感',
    description: '米白纸张 + 黑色文字，纯净阅读体验',
    category: 'minimal',
    emoji: '📄',
    palette: {
      primary: '2D2D2D',
      secondary: '999999',
      accent: '2D2D2D',
      text: '2D2D2D',
      textSecondary: '666666',
      background: 'FAF8F3',
      surface: 'FFFFFF',
      border: 'E5E0D5'
    },
    fonts: {
      title: 'SimSun',
      body: 'Microsoft YaHei',
      mono: 'Consolas',
      titleSize: 28,
      bodySize: 16,
      captionSize: 12
    },
    decoration: {
      hasGradient: false,
      hasPattern: false,
      hasShadow: false,
      cornerRadius: 0,
      titleStyle: 'minimal',
      contentStyle: 'bullet'
    }
  }
];
