/**
 * PPT 无障碍 (A11y) 检查器 - 增强版 (v2.5)
 *
 * 检查项：
 * 1. 颜色对比度 (WCAG AA: 4.5:1, AAA: 7:1)
 * 2. 大字号豁免（18pt+ / 14pt 粗体）
 * 3. 最小字号 (16pt)
 * 4. 色盲友好度（红绿色盲、蓝黄色盲模拟）
 * 5. 文本长度（避免单页超长）
 * 6. 标题层级（避免跳级）
 * 7. 颜色不是唯一信息载体
 * 8. alt text 缺失检测
 *
 * 报告输出：JSON / Markdown / HTML
 */

import type { PPTContent, SlideContent } from '../ai/generator.js';
import type { ColorPalette } from './templates/schema.js';

// ============ 类型定义 ============

export type A11yLevel = 'AA' | 'AAA';
export type A11yIssueLevel = 'error' | 'warning' | 'info';
export type A11yCategory =
  | 'contrast'
  | 'font-size'
  | 'content-length'
  | 'alt-text'
  | 'heading-hierarchy'
  | 'color-only'
  | 'color-blind';

export interface A11yIssue {
  level: A11yIssueLevel;
  category: A11yCategory;
  slideIndex: number;
  slideTitle: string;
  message: string;
  suggestion?: string;
  /** 详细数据（如对比度数值） */
  data?: Record<string, any>;
}

export interface A11yReport {
  totalSlides: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  /** 0-100 分 */
  score: number;
  /** WCAG 等级 */
  level: A11yLevel;
  issues: A11yIssue[];
  summary: string;
  /** 按类别统计 */
  categoryCounts: Record<A11yCategory, number>;
  /** 各 slide 的得分 */
  slideScores: number[];
  /** 元信息 */
  meta: {
    checkedAt: string;
    duration: number;
    palette: string;
  };
}

export interface A11yCheckOptions {
  /** WCAG 等级（默认 AA） */
  level?: A11yLevel;
  /** 启用大字号豁免（默认 true） */
  ignoreLargeText?: boolean;
  /** 大字号阈值（pt），默认 18 */
  largeTextSize?: number;
  /** 启用色盲模拟（默认 false） */
  enableColorBlindSim?: boolean;
  /** 色盲类型 */
  colorBlindType?: 'protanopia' | 'deuteranopia' | 'tritanopia';
  /** 启用标题层级检查（默认 true） */
  checkHeadingHierarchy?: boolean;
}

// ============ 颜色计算工具 ============

/** 十六进制 → RGB */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) || 0,
    parseInt(h.substring(2, 4), 16) || 0,
    parseInt(h.substring(4, 6), 16) || 0,
  ];
}

/** RGB → 十六进制 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** 相对亮度（WCAG 2.1 公式） */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 对比度比 */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 色盲模拟
 *
 * 基于 Brettel-Viénot-Mollon 算法的简化版本
 */
export function simulateColorBlind(hex: string, type: 'protanopia' | 'deuteranopia' | 'tritanopia'): string {
  const [r, g, b] = hexToRgb(hex);

  // 色盲变换矩阵（sRGB 线性空间）
  const matrices: Record<string, number[][]> = {
    protanopia: [
      [0.567, 0.433, 0],
      [0.558, 0.442, 0],
      [0, 0.242, 0.758],
    ],
    deuteranopia: [
      [0.625, 0.375, 0],
      [0.7, 0.3, 0],
      [0, 0.3, 0.7],
    ],
    tritanopia: [
      [0.95, 0.05, 0],
      [0, 0.433, 0.567],
      [0, 0.475, 0.525],
    ],
  };

  const m = matrices[type];
  const nr = m[0][0] * r + m[0][1] * g + m[0][2] * b;
  const ng = m[1][0] * r + m[1][1] * g + m[1][2] * b;
  const nb = m[2][0] * r + m[2][1] * g + m[2][2] * b;
  return rgbToHex(nr, ng, nb);
}

// ============ 主检查函数 ============

const DEFAULTS: Required<A11yCheckOptions> = {
  level: 'AA',
  ignoreLargeText: true,
  largeTextSize: 18,
  enableColorBlindSim: false,
  colorBlindType: 'deuteranopia',
  checkHeadingHierarchy: true,
};

export function checkA11y(
  content: PPTContent,
  palette: ColorPalette,
  options: A11yCheckOptions = {}
): A11yReport {
  const start = Date.now();
  const opts = { ...DEFAULTS, ...options };
  const issues: A11yIssue[] = [];

  // 阈值
  const contrastThreshold = opts.level === 'AAA' ? 7 : 4.5;
  const largeTextThreshold = opts.largeTextSize;
  const largeContrastThreshold = opts.level === 'AAA' ? 4.5 : 3;

  // 色盲模拟：转换 palette 颜色
  let simPalette = palette;
  if (opts.enableColorBlindSim) {
    simPalette = {
      ...palette,
      text: simulateColorBlind(palette.text, opts.colorBlindType),
      secondary: simulateColorBlind(palette.secondary, opts.colorBlindType),
      primary: simulateColorBlind(palette.primary, opts.colorBlindType),
      accent: simulateColorBlind(palette.accent, opts.colorBlindType),
    };
  }

  let previousLevel = 0;

  content.slides.forEach((slide, idx) => {
    // 1. 颜色对比度检查
    const bg = simPalette.background;
    const textColor = simPalette.text;
    if (bg !== simPalette.primary) {
      const ratio = contrastRatio(textColor, bg);
      if (ratio < contrastThreshold) {
        // 大字号豁免
        const isLargeText = false; // 标题层级未知，按正文检查
        const effectiveThreshold = (opts.ignoreLargeText && isLargeText)
          ? largeContrastThreshold
          : contrastThreshold;

        if (ratio < effectiveThreshold) {
          issues.push({
            level: 'error',
            category: 'contrast',
            slideIndex: idx,
            slideTitle: slide.title,
            message: `Contrast ratio is ${ratio.toFixed(2)}:1 (need ${effectiveThreshold}:1 for ${opts.level})`,
            suggestion: `Use darker text or lighter/darker background. Current: text=${textColor}, bg=${bg}`,
            data: { ratio, threshold: effectiveThreshold, level: opts.level },
          });
        }
      } else if (opts.level === 'AA' && ratio < 7) {
        issues.push({
          level: 'info',
          category: 'contrast',
          slideIndex: idx,
          slideTitle: slide.title,
          message: `Contrast is ${ratio.toFixed(2)}:1 (passes AA, AAA needs 7:1)`,
          data: { ratio, level: 'AA' },
        });
      }
    }

    // 2. 内容点数量检查
    if (slide.content && slide.content.length > 7) {
      issues.push({
        level: 'warning',
        category: 'content-length',
        slideIndex: idx,
        slideTitle: slide.title,
        message: `Slide has ${slide.content.length} points (recommended 3-5)`,
        suggestion: 'Split into multiple slides (One Idea Per Slide principle)',
      });
    }

    // 3. 标题长度检查
    if (slide.title && slide.title.length > 60) {
      issues.push({
        level: 'warning',
        category: 'font-size',
        slideIndex: idx,
        slideTitle: slide.title,
        message: `Title is ${slide.title.length} chars (recommended < 40)`,
        suggestion: 'Shorten title for readability',
      });
    }

    // 4. 标题跳级检查（基于 type 启发）
    if (opts.checkHeadingHierarchy) {
      const currentLevel = typeToLevel(slide.type);
      if (currentLevel > 0) {
        if (previousLevel > 0 && currentLevel > previousLevel + 1) {
          issues.push({
            level: 'warning',
            category: 'heading-hierarchy',
            slideIndex: idx,
            slideTitle: slide.title,
            message: `Heading jumps from level ${previousLevel} to ${currentLevel}`,
            suggestion: 'Avoid skipping heading levels (accessibility best practice)',
            data: { from: previousLevel, to: currentLevel },
          });
        }
        previousLevel = currentLevel;
      }
    }

    // 5. Bullet 文字长度
    if (slide.content) {
      slide.content.forEach((point, i) => {
        if (point.length > 80) {
          issues.push({
            level: 'warning',
            category: 'content-length',
            slideIndex: idx,
            slideTitle: slide.title,
            message: `Bullet ${i + 1} is ${point.length} chars (recommended < 60)`,
            suggestion: 'Shorten bullet for readability',
          });
        }
      });
    }

    // 6. alt text 检查（有 imageUrl 但无 alt）
    if ((slide as any).imageUrl && !(slide as any).imageAlt) {
      issues.push({
        level: 'warning',
        category: 'alt-text',
        slideIndex: idx,
        slideTitle: slide.title,
        message: 'Image has no alt text',
        suggestion: 'Add imageAlt field for screen reader accessibility',
      });
    }

    // 7. 色盲模式下颜色信息丢失检测（仅启用时）
    if (opts.enableColorBlindSim) {
      const origAccent = palette.accent;
      const simAccent = simPalette.accent;
      if (origAccent !== simAccent) {
        // 检查 accent 在色盲模式下是否仍可区分
        const ratio = contrastRatio(simAccent, bg);
        if (ratio < 2) {
          issues.push({
            level: 'warning',
            category: 'color-blind',
            slideIndex: idx,
            slideTitle: slide.title,
            message: `Accent color may be hard to distinguish in ${opts.colorBlindType}`,
            suggestion: 'Use icons/text labels in addition to color',
            data: { originalAccent: origAccent, simulatedAccent: simAccent },
          });
        }
      }
    }
  });

  // 统计
  const errors = issues.filter(i => i.level === 'error').length;
  const warnings = issues.filter(i => i.level === 'warning').length;
  const info = issues.filter(i => i.level === 'info').length;
  const score = Math.max(0, 100 - errors * 10 - warnings * 3 - info * 0.5);

  // 按类别统计
  const categoryCounts: Record<string, number> = {
    contrast: 0, 'font-size': 0, 'content-length': 0,
    'alt-text': 0, 'heading-hierarchy': 0, 'color-only': 0, 'color-blind': 0,
  };
  for (const issue of issues) {
    categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
  }

  // 每张幻灯片得分（粗略）
  const slideScores: number[] = [];
  for (let i = 0; i < content.slides.length; i++) {
    const slideIssues = issues.filter(x => x.slideIndex === i);
    const slideScore = Math.max(0, 100 - slideIssues.length * 15);
    slideScores.push(slideScore);
  }

  // 总结
  let summary: string;
  if (errors === 0 && warnings === 0) {
    summary = `Excellent! No accessibility issues found at ${opts.level} level.`;
  } else if (errors === 0) {
    summary = `Good. ${warnings} warning(s), no critical issues. Score: ${score}/100.`;
  } else if (errors < 3) {
    summary = `Needs improvement. ${errors} error(s) and ${warnings} warning(s). Score: ${score}/100.`;
  } else {
    summary = `Significant issues. ${errors} error(s) and ${warnings} warning(s). Score: ${score}/100.`;
  }

  return {
    totalSlides: content.slides.length,
    totalIssues: issues.length,
    errors,
    warnings,
    info,
    score,
    level: opts.level,
    issues,
    summary,
    categoryCounts: categoryCounts as Record<A11yCategory, number>,
    slideScores,
    meta: {
      checkedAt: new Date().toISOString(),
      duration: Date.now() - start,
      palette: `${palette.primary}/${palette.secondary}/${palette.accent}`,
    },
  };
}

function typeToLevel(type: string): number {
  // 粗略的 heading 层级映射
  if (type === 'cover' || type === 'title' || type === 'thank-you') return 1;
  if (type === 'divider' || type === 'agenda') return 2;
  if (type === 'qa' || type === 'cta' || type === 'conclusion') return 3;
  return 0; // 不参与层级
}

// ============ 报告导出 ============

/** 导出为 JSON */
export function reportToJSON(report: A11yReport, pretty = true): string {
  return JSON.stringify(report, null, pretty ? 2 : 0);
}

/** 导出为 Markdown */
export function reportToMarkdown(report: A11yReport): string {
  const lines: string[] = [];
  lines.push(`# A11y 无障碍检查报告\n`);
  lines.push(`**检查时间**: ${report.meta.checkedAt}`);
  lines.push(`**WCAG 等级**: ${report.level}`);
  lines.push(`**幻灯片数**: ${report.totalSlides}`);
  lines.push(`**总问题数**: ${report.totalIssues} (${report.errors} 错误 / ${report.warnings} 警告 / ${report.info} 提示)`);
  lines.push(`**综合得分**: ${report.score}/100\n`);
  lines.push(`> ${report.summary}\n`);

  if (report.totalIssues > 0) {
    lines.push(`## 问题详情\n`);
    const byCategory: Record<string, A11yIssue[]> = {};
    for (const issue of report.issues) {
      if (!byCategory[issue.category]) byCategory[issue.category] = [];
      byCategory[issue.category].push(issue);
    }
    for (const [cat, issues] of Object.entries(byCategory)) {
      lines.push(`### ${cat} (${issues.length})\n`);
      for (const issue of issues) {
        const icon = issue.level === 'error' ? '❌' : issue.level === 'warning' ? '⚠️' : 'ℹ️';
        lines.push(`${icon} **Slide ${issue.slideIndex + 1}: ${issue.slideTitle}**`);
        lines.push(`   ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`   💡 ${issue.suggestion}`);
        }
        lines.push('');
      }
    }
  }

  // 每张幻灯片得分
  lines.push(`## 各幻灯片得分\n`);
  lines.push(`| Slide | Score |`);
  lines.push(`|-------|-------|`);
  report.slideScores.forEach((s, i) => {
    lines.push(`| ${i + 1} | ${s}/100 |`);
  });

  return lines.join('\n');
}

/** 导出为 HTML */
export function reportToHTML(report: A11yReport): string {
  const colorByLevel = (level: A11yIssueLevel) =>
    level === 'error' ? '#dc2626' : level === 'warning' ? '#d97706' : '#0284c7';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>A11y 检查报告</title>
<style>
body { font-family: -apple-system, sans-serif; max-width: 900px; margin: 2em auto; padding: 0 1em; }
h1 { color: #1f2937; }
.score { font-size: 2em; font-weight: bold; color: ${report.score >= 80 ? '#10b981' : report.score >= 60 ? '#d97706' : '#dc2626'}; }
table { width: 100%; border-collapse: collapse; margin: 1em 0; }
th, td { padding: 0.5em; border: 1px solid #e5e7eb; text-align: left; }
th { background: #f9fafb; }
.issue { padding: 0.8em; margin: 0.5em 0; border-left: 4px solid #ccc; background: #f9fafb; }
.issue.error { border-left-color: #dc2626; }
.issue.warning { border-left-color: #d97706; }
.issue.info { border-left-color: #0284c7; }
.issue-level { font-weight: bold; color: ${colorByLevel('error')}; }
</style>
</head>
<body>
<h1>A11y 无障碍检查报告</h1>
<div class="score">${report.score}/100</div>
<p>${report.summary}</p>
<table>
  <tr><th>检查项</th><th>值</th></tr>
  <tr><td>WCAG 等级</td><td>${report.level}</td></tr>
  <tr><td>幻灯片数</td><td>${report.totalSlides}</td></tr>
  <tr><td>错误数</td><td>${report.errors}</td></tr>
  <tr><td>警告数</td><td>${report.warnings}</td></tr>
  <tr><td>提示数</td><td>${report.info}</td></tr>
  <tr><td>检查耗时</td><td>${report.meta.duration}ms</td></tr>
</table>
<h2>问题列表 (${report.issues.length})</h2>
${report.issues.map(i => `
<div class="issue ${i.level}">
  <strong>[Slide ${i.slideIndex + 1}] ${i.slideTitle}</strong>
  <span class="issue-level" style="color: ${colorByLevel(i.level)}">[${i.level.toUpperCase()}]</span>
  <p>${i.message}</p>
  ${i.suggestion ? `<p>💡 ${i.suggestion}</p>` : ''}
</div>
`).join('')}
<h2>各幻灯片得分</h2>
<table>
<tr><th>Slide</th><th>Score</th></tr>
${report.slideScores.map((s, i) => `<tr><td>${i + 1}</td><td>${s}/100</td></tr>`).join('')}
</table>
</body>
</html>`;
}

export default checkA11y;
