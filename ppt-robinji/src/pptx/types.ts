/**
 * PPT 模板系统 - 类型定义
 */

export interface ColorPalette {
  primary: string;      // 主色
  secondary: string;    // 辅色
  accent: string;       // 强调色
  text: string;         // 主文字色
  textSecondary: string; // 次要文字色
  background: string;   // 背景色
  surface: string;      // 卡片/表面色
  border: string;       // 边框色
}

export interface FontConfig {
  title: string;        // 标题字体
  body: string;         // 正文字体
  mono: string;         // 等宽字体（代码等）
  titleSize: number;    // 标题字号
  bodySize: number;     // 正文字号
  captionSize: number;  // 备注字号
}

export interface DecorationConfig {
  hasGradient: boolean;   // 是否使用渐变背景
  hasPattern: boolean;    // 是否使用图案装饰
  hasShadow: boolean;     // 是否使用阴影
  cornerRadius: number;   // 圆角半径
  titleStyle: 'classic' | 'modern' | 'minimal' | 'elegant' | 'bold';
  contentStyle: 'bullet' | 'card' | 'timeline' | 'two-column' | 'icon';
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'tech' | 'academic' | 'creative' | 'education'
         | 'medical' | 'finance' | 'minimal' | 'dark' | 'gradient'
         | 'editorial' | 'brutalist' | 'dark-mode' | 'glass';
  palette: ColorPalette;
  fonts: FontConfig;
  decoration: DecorationConfig;
  emoji: string;        // 用于 CLI 展示
  preview?: string;     // 预览图路径（可选）
}

export type TemplateId = string;
