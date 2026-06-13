/**
 * 金融风模板 - 大气、权威、适合金融/投资主题
 */

import type { Template } from './types.js';

export const financeTemplates: Template[] = [
  {
    id: 'finance-gold',
    name: '金典金融',
    description: '深绿 + 金色，权威稳重',
    category: 'finance',
    emoji: '💰',
    palette: {
      primary: '0B3D2E',
      secondary: 'D4AF37',
      accent: 'D4AF37',
      text: 'FFFFFF',
      textSecondary: 'BFC8B8',
      background: '0B3D2E',
      surface: 'F8F6F0',
      border: 'B89C4D'
    },
    fonts: {
      title: 'SimSun',
      body: 'Microsoft YaHei',
      mono: 'Consolas',
      titleSize: 30,
      bodySize: 17,
      captionSize: 12
    },
    decoration: {
      hasGradient: true,
      hasPattern: false,
      hasShadow: true,
      cornerRadius: 4,
      titleStyle: 'elegant',
      contentStyle: 'card'
    }
  }
];
