/**
 * 国际化 (i18n) 类型定义
 *
 * 用于双语/多语言 PPT 生成。
 */

/** 支持的语言 */
export type Language = 'zh-CN' | 'zh-TW' | 'en-US' | 'en-GB' | 'ja-JP' | 'ko-KR' | 'es-ES' | 'fr-FR' | 'de-DE';

/** 双语版式 */
export type BilingualLayout = 'two-column' | 'two-page' | 'subtitle' | 'interleaved';

/** 术语表条目 */
export interface GlossaryEntry {
  /** 源语言术语 */
  source: string;
  /** 目标语言翻译（必须） */
  target: string;
  /** 上下文（如 "AI 训练" 帮助消歧） */
  context?: string;
}

/** 术语表 */
export type Glossary = Record<string, string> | GlossaryEntry[];

/** 翻译选项 */
export interface TranslateOptions {
  /** 源语言 */
  source: Language;
  /** 目标语言 */
  target: Language;
  /** AI Provider（默认 deepseek） */
  provider?: string;
  /** 术语表（保证专业词汇翻译一致） */
  glossary?: Glossary;
  /** 翻译风格 */
  style?: 'formal' | 'casual' | 'technical' | 'marketing';
  /** 保留占位符（${var}、{name} 等） */
  preservePlaceholders?: boolean;
}

/** 翻译结果 */
export interface TranslationResult {
  /** 原始文本 */
  original: string;
  /** 翻译后文本 */
  translated: string;
  /** 源/目标语言 */
  source: Language;
  target: Language;
  /** 翻译置信度（0-1，可选） */
  confidence?: number;
}

/** 翻译器接口 */
export interface Translator {
  /** 翻译器名称 */
  name: string;
  /** 是否可用 */
  isAvailable(): Promise<boolean>;
  /** 翻译文本 */
  translate(text: string, options: TranslateOptions): Promise<string>;
  /** 批量翻译 */
  translateBatch(texts: string[], options: TranslateOptions): Promise<string[]>;
}

/** 双语幻灯片内容 */
export interface BilingualSlide {
  /** 主语言（如中文） */
  primary: import('../ai/generator.js').SlideContent;
  /** 次语言（如英文） */
  secondary: import('../ai/generator.js').SlideContent;
  /** 该 slide 应用的术语覆盖 */
  glossary?: Glossary;
}

/** 双语 PPT 内容 */
export interface BilingualContent {
  /** 主标题（如中文标题） */
  primaryTitle: string;
  /** 次标题（如英文标题） */
  secondaryTitle: string;
  /** 双语幻灯片列表 */
  slides: BilingualSlide[];
  /** 版式 */
  layout: BilingualLayout;
  /** 元信息 */
  meta?: {
    sourceLanguage: Language;
    targetLanguage: Language;
    generatedAt: string;
    glossary?: Glossary;
  };
}
