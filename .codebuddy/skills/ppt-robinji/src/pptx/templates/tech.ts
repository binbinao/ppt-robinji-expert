/**
 * 科技风模板 - 现代、未来感、适合技术分享
 */

import type { Template } from './types.js';

export const techTemplates: Template[] = [
  {
    id: 'tech-neon',
    name: '赛博霓虹',
    description: '深色背景 + 霓虹色调，未来科技感强',
    category: 'tech',
    emoji: '🚀',
    palette: {
      primary: '0A0E27',
      secondary: '00F5FF',
      accent: 'FF006E',
      text: 'FFFFFF',
      textSecondary: 'B0B8C8',
      background: '0A0E27',
      surface: '1A1F3A',
      border: '00F5FF'
    },
    fonts: {
      title: 'Consolas',
      body: 'Microsoft YaHei',
      mono: 'Consolas',
      titleSize: 32,
      bodySize: 16,
      captionSize: 12
    },
    decoration: {
      hasGradient: true,
      hasPattern: true,
      hasShadow: true,
      cornerRadius: 8,
      titleStyle: 'modern',
      contentStyle: 'card'
    }
  },
  {
    id: 'tech-circuit',
    name: '电路绿',
    description: '经典终端风格，黑底绿字致敬极客文化',
    category: 'tech',
    emoji: '⚡',
    palette: {
      primary: '0D1117',
      secondary: '39D353',
      accent: 'F78166',
      text: '39D353',
      textSecondary: '7EE787',
      background: '0D1117',
      surface: '161B22',
      border: '30363D'
    },
    fonts: {
      title: 'Consolas',
      body: 'Consolas',
      mono: 'Consolas',
      titleSize: 28,
      bodySize: 16,
      captionSize: 12
    },
    decoration: {
      hasGradient: false,
      hasPattern: true,
      hasShadow: false,
      cornerRadius: 0,
      titleStyle: 'bold',
      contentStyle: 'bullet'
    }
  }
];
