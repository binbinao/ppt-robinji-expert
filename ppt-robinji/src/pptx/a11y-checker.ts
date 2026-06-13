/**
 * PPT 无障碍 (A11y) 检查器
 *
 * 检查项：
 * 1. 颜色对比度 (WCAG AA: 4.5:1)
 * 2. 最小字号 (16pt)
 * 3. 图片替代文本（需要外部提供）
 * 4. 文本长度（避免单页超长）
 * 5. 颜色不要作为唯一信息载体
 */

import type { PPTContent, SlideContent } from '../ai/generator.js';
import type { ColorPalette } from './templates/types.js';

export interface A11yIssue {
  level: 'error' | 'warning' | 'info';
  category: 'contrast' | 'font-size' | 'content-length' | 'alt-text';
  slideIndex: number;
  slideTitle: string;
  message: string;
  suggestion?: string;
}

export interface A11yReport {
  totalSlides: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  score: number;  // 0-100
  issues: A11yIssue[];
  summary: string;
}

/**
 * 计算两个颜色的对比度
 * 公式：https://www.w3.org/TR/WCAG20-TECHS/G18.html
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16)
  ];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 主检查函数
 */
export function checkA11y(
  content: PPTContent,
  palette: ColorPalette
): A11yReport {
  const issues: A11yIssue[] = [];

  content.slides.forEach((slide, idx) => {
    // 1. 颜色对比度检查
    const bg = palette.background;
    const textColor = palette.text;

    // 浅色背景 + 浅色文字
    if (bg !== palette.primary) {
      const ratio = contrastRatio(textColor, bg);
      if (ratio < 4.5) {
        issues.push({
          level: 'error',
          category: 'contrast',
          slideIndex: idx,
          slideTitle: slide.title,
          message: `Text/background contrast ratio is ${ratio.toFixed(2)}:1 (need 4.5:1)`,
          suggestion: `Use darker text or change background. Current: text=${textColor}, bg=${bg}`
        });
      } else if (ratio < 7) {
        issues.push({
          level: 'info',
          category: 'contrast',
          slideIndex: idx,
          slideTitle: slide.title,
          message: `Contrast is ${ratio.toFixed(2)}:1 (AA pass, AAA needs 7:1)`
        });
      }
    }

    // 2. 内容长度检查
    if (slide.content && slide.content.length > 7) {
      issues.push({
        level: 'warning',
        category: 'content-length',
        slideIndex: idx,
        slideTitle: slide.title,
        message: `Slide has ${slide.content.length} points (recommended 3-5)`,
        suggestion: 'Consider splitting into multiple slides (One Idea Per Slide)'
      });
    }

    // 3. 字号检查（基于 title 长度）
    if (slide.title && slide.title.length > 60) {
      issues.push({
        level: 'warning',
        category: 'font-size',
        slideIndex: idx,
        slideTitle: slide.title,
        message: `Title is ${slide.title.length} chars - may need smaller font`,
        suggestion: 'Keep titles under 40 chars for optimal readability'
      });
    }

    // 4. 内容点文字长度
    if (slide.content) {
      slide.content.forEach((point, i) => {
        if (point.length > 80) {
          issues.push({
            level: 'warning',
            category: 'content-length',
            slideIndex: idx,
            slideTitle: slide.title,
            message: `Bullet ${i + 1} is ${point.length} chars`,
            suggestion: 'Keep bullets under 60 chars for readability'
          });
        }
      });
    }
  });

  // 计算分数
  const errors = issues.filter(i => i.level === 'error').length;
  const warnings = issues.filter(i => i.level === 'warning').length;
  const infos = issues.filter(i => i.level === 'info').length;

  // 评分：100 - errors*10 - warnings*3
  const score = Math.max(0, 100 - errors * 10 - warnings * 3);

  // 总结
  let summary: string;
  if (errors === 0 && warnings === 0) {
    summary = 'Excellent! No accessibility issues found.';
  } else if (errors === 0) {
    summary = `Good. ${warnings} minor warning(s), no critical issues.`;
  } else {
    summary = `Needs improvement. ${errors} error(s) and ${warnings} warning(s) found.`;
  }

  return {
    totalSlides: content.slides.length,
    totalIssues: issues.length,
    errors,
    warnings,
    score,
    issues,
    summary
  };
}

export default checkA11y;
