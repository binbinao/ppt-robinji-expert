/**
 * PPT 内容分析器
 *
 * 分析每页内容的密度特征（字数、要点数、文本长度），
 * 自动决定布局策略、字号、留白，确保视觉效果最佳。
 *
 * 设计原则：
 * - 内容少时：大字 + 多留白，避免空洞
 * - 内容中等：标准布局 + 适中留白
 * - 内容密集：小字 + 紧凑排版 + 分栏/网格
 */

import type { ColorPalette, FontConfig } from './templates/types.js';

export type ContentDensity = 'sparse' | 'normal' | 'dense' | 'overflow';

export interface ContentMetrics {
  itemCount: number;          // 要点/段落数
  totalChars: number;         // 总字符数
  avgCharsPerItem: number;    // 平均每条字符
  maxChars: number;           // 最长一条字符
  hasLongText: boolean;       // 是否含长文本（>30 字）
  density: ContentDensity;    // 密度等级
}

export interface LayoutConfig {
  fontSize: number;           // 字号
  lineSpacing: number;        // 行距倍数
  itemSpacing: number;        // 要点间距（pt）
  topPadding: number;         // 上内边距
  bottomPadding: number;      // 下内边距
  useMultiColumn: boolean;    // 是否分栏
  useCardLayout: boolean;     // 是否卡片网格
  columns: number;            // 列数（1/2/3）
}

/**
 * 分析内容，返回密度指标
 */
export function analyzeContent(items: string[]): ContentMetrics {
  if (!items || items.length === 0) {
    return {
      itemCount: 0,
      totalChars: 0,
      avgCharsPerItem: 0,
      maxChars: 0,
      hasLongText: false,
      density: 'sparse'
    };
  }

  const itemCount = items.length;
  const totalChars = items.reduce((sum, s) => sum + (s?.length || 0), 0);
  const avgCharsPerItem = totalChars / itemCount;
  const maxChars = Math.max(...items.map(s => s?.length || 0));
  const hasLongText = items.some(s => s.length > 30);

  let density: ContentDensity;

  if (itemCount === 0) {
    density = 'sparse';
  } else if (itemCount <= 2 && totalChars < 50) {
    // 极少内容：1-2 条且总字数 < 50
    density = 'sparse';
  } else if (itemCount <= 5 && totalChars < 200) {
    // 正常内容：3-5 条，总字数 50-200
    density = 'normal';
  } else if (itemCount <= 8 && totalChars < 400) {
    // 较密集：6-8 条，总字数 200-400
    density = 'dense';
  } else {
    // 极密集：>8 条或 >400 字
    density = 'overflow';
  }

  return {
    itemCount,
    totalChars,
    avgCharsPerItem: Math.round(avgCharsPerItem),
    maxChars,
    hasLongText,
    density
  };
}

/**
 * 根据内容密度 + 模板字号配置，计算最佳布局
 */
export function decideLayout(
  metrics: ContentMetrics,
  fonts: FontConfig
): LayoutConfig {
  const baseSize = fonts.bodySize;
  const baseTitleSize = fonts.titleSize;

  switch (metrics.density) {
    case 'sparse':
      // 留白型：大字 + 多留白
      return {
        fontSize: baseSize + 6,           // 24 → 大字
        lineSpacing: 1.5,
        itemSpacing: 20,
        topPadding: 1.8,                  // 顶部留白多
        bottomPadding: 0.8,
        useMultiColumn: false,
        useCardLayout: false,
        columns: 1
      };

    case 'normal':
      // 标准型：标准字号 + 正常间距
      return {
        fontSize: baseSize,               // 18
        lineSpacing: 1.4,
        itemSpacing: 14,
        topPadding: 1.4,
        bottomPadding: 0.6,
        useMultiColumn: false,
        useCardLayout: false,
        columns: 1
      };

    case 'dense':
      // 紧凑型：小字 + 较小间距
      return {
        fontSize: baseSize - 2,           // 16
        lineSpacing: 1.3,
        itemSpacing: 8,
        topPadding: 1.3,
        bottomPadding: 0.5,
        useMultiColumn: false,
        useCardLayout: metrics.itemCount >= 4,  // 4+ 用卡片
        columns: metrics.itemCount >= 6 ? 2 : 1
      };

    case 'overflow':
      // 溢出型：更小字 + 网格 + 多列
      return {
        fontSize: baseSize - 4,           // 14
        lineSpacing: 1.25,
        itemSpacing: 6,
        topPadding: 1.2,
        bottomPadding: 0.4,
        useMultiColumn: true,
        useCardLayout: true,
        columns: 2
      };
  }
}

/**
 * 检查文字是否会溢出，给出警告
 */
export function checkOverflow(metrics: ContentMetrics, layout: LayoutConfig): {
  willOverflow: boolean;
  warning?: string;
} {
  // 极简内容但用密集布局 → 警告留白过多
  if (metrics.density === 'sparse' && layout.columns > 1) {
    return {
      willOverflow: false,
      warning: '内容较少但使用了多列布局，建议改为单列居中显示'
    };
  }

  // 极多内容但用稀疏布局 → 警告会溢出
  if (metrics.density === 'overflow' && !layout.useMultiColumn) {
    return {
      willOverflow: true,
      warning: '内容过多但未使用多列布局，文字可能溢出页面'
    };
  }

  // 长文本字号过小 → 警告
  if (metrics.hasLongText && layout.fontSize < 14) {
    return {
      willOverflow: true,
      warning: `包含长文本（${metrics.maxChars}字）但字号仅 ${layout.fontSize}pt，可能影响可读性`
    };
  }

  return { willOverflow: false };
}

/**
 * 智能字号：根据文本长度微调
 * 长文本略大、短文本略小（保持视觉平衡）
 */
export function adjustFontSize(baseSize: number, text: string, hasLongText: boolean): number {
  const len = text.length;
  if (len <= 15) return baseSize;       // 短文本：基准
  if (len <= 30) return baseSize - 1;   // 中等：略小
  if (len <= 50) return baseSize - 2;   // 较长：再小
  return baseSize - 3;                  // 长文本：最小
}
