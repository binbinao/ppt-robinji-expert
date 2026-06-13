/**
 * 渐变风模板 - 色彩丰富、视觉冲击力强
 */

import type { Template } from './types.js';

export const gradientTemplates: Template[] = [
  {
    id: 'gradient-ocean',
    name: '海洋渐变',
    description: '深海蓝渐变，宁静深邃',
    category: 'gradient',
    emoji: '🌊',
    palette: {
      primary: '065A82',
      secondary: '1C7293',
      accent: '9EB3C2',
      text: 'FFFFFF',
      textSecondary: 'BFD7EA',
      background: '065A82',
      surface: '1C7293',
      border: '9EB3C2'
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
      mono: 'Consolas',
      titleSize: 32,
      bodySize: 18,
      captionSize: 12
    },
    decoration: {
      hasGradient: true,
      hasPattern: false,
      hasShadow: true,
      cornerRadius: 8,
      titleStyle: 'modern',
      contentStyle: 'card'
    }
  },
  {
    id: 'gradient-sunset',
    name: '日落黄昏',
    description: '橙红渐变，温暖活力',
    category: 'gradient',
    emoji: '🌅',
    palette: {
      primary: 'FF6B35',
      secondary: 'F7931E',
      accent: 'FFD23F',
      text: 'FFFFFF',
      textSecondary: 'FFE5B4',
      background: 'FF6B35',
      surface: 'F7931E',
      border: 'FFD23F'
    },
    fonts: {
      title: 'Microsoft YaHei',
      body: 'Microsoft YaHei',
      mono: 'Consolas',
      titleSize: 32,
      bodySize: 18,
      captionSize: 12
    },
    decoration: {
      hasGradient: true,
      hasPattern: false,
      hasShadow: true,
      cornerRadius: 8,
      titleStyle: 'bold',
      contentStyle: 'card'
    }
  },
  {
    id: 'gradient-forest',
    name: '森林清晨',
    description: '绿色渐变，自然清新',
    category: 'gradient',
    emoji: '🌲',
    palette: {
      primary: '1B4332',
      secondary: '2D6A4F',
      accent: '95D5B2',
      text: 'FFFFFF',
      textSecondary: 'B7E4C7',
      background: '1B4332',
      surface: '2D6A4F',
      border: '95D5B2'
    },
    fonts: {
      title: 'Microsoft YaHei',
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
      cornerRadius: 8,
      titleStyle: 'modern',
      contentStyle: 'card'
    }
  }
];
