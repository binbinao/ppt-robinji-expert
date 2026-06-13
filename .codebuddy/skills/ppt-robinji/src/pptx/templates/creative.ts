/**
 * 创意风模板 - 活泼、大胆、适合品牌发布
 */

import type { Template } from './types.js';

export const creativeTemplates: Template[] = [
  {
    id: 'creative-coral',
    name: '珊瑚活力',
    description: '暖色调 + 撞色，年轻有活力',
    category: 'creative',
    emoji: '🌈',
    palette: {
      primary: 'F96167',
      secondary: 'F9E795',
      accent: '2F3C7E',
      text: '212121',
      textSecondary: '4A4A4A',
      background: 'F96167',
      surface: 'FFF5E1',
      border: 'F9E795'
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
      mono: 'Consolas',
      titleSize: 36,
      bodySize: 18,
      captionSize: 13
    },
    decoration: {
      hasGradient: true,
      hasPattern: true,
      hasShadow: true,
      cornerRadius: 12,
      titleStyle: 'bold',
      contentStyle: 'card'
    }
  },
  {
    id: 'creative-aurora',
    name: '极光梦境',
    description: '紫蓝渐变 + 神秘色彩，艺术感强',
    category: 'creative',
    emoji: '✨',
    palette: {
      primary: '7B2CBF',
      secondary: 'C77DFF',
      accent: 'E0AAFF',
      text: 'FFFFFF',
      textSecondary: 'E0AAFF',
      background: '240046',
      surface: '3C096C',
      border: 'C77DFF'
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
      mono: 'Consolas',
      titleSize: 34,
      bodySize: 18,
      captionSize: 13
    },
    decoration: {
      hasGradient: true,
      hasPattern: true,
      hasShadow: true,
      cornerRadius: 10,
      titleStyle: 'elegant',
      contentStyle: 'card'
    }
  }
];
