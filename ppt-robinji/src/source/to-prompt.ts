import type { SourceContent, SourceSection } from './types.js';

/**
 * 将 SourceContent 转为 AI 可消费的输入格式
 *
 * 设计原则：
 * - 保留结构（Heading 层级）
 * - 控制长度（防止 prompt 过长被截断）
 * - 提供清晰的引导指令
 */
export interface ToPromptOptions {
  /** 最大 sections 数量 */
  maxSections?: number;
  /** 每个 section 最大字符数 */
  maxSectionLength?: number;
  /** 是否包含文件元信息 */
  includeMetadata?: boolean;
}

const DEFAULTS: Required<ToPromptOptions> = {
  maxSections: 20,
  maxSectionLength: 1500,
  includeMetadata: true,
};

/**
 * 构造 AI 提示：基于源文档生成 PPT 大纲
 */
export function sourceToPromptText(source: SourceContent, options: ToPromptOptions = {}): string {
  const opts = { ...DEFAULTS, ...options };
  const parts: string[] = [];

  if (opts.includeMetadata) {
    parts.push(`# Source Document: ${source.title}`);
    parts.push(`Type: ${source.sourceType}`);
    if (source.metadata) {
      const meta = Object.entries(source.metadata)
        .filter(([_, v]) => v != null && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (meta) parts.push(`Metadata: ${meta}`);
    }
    parts.push('');
  }

  if (source.sections && source.sections.length > 0) {
    parts.push('## Document Outline');
    parts.push('');
    const limited = source.sections.slice(0, opts.maxSections);
    for (const section of limited) {
      const headingPrefix = section.level > 0 ? `${'#'.repeat(section.level)} ` : '';
      const heading = section.heading || '(untitled)';
      parts.push(`${headingPrefix}${heading}`);
      if (section.content) {
        const truncated = section.content.length > opts.maxSectionLength
          ? section.content.substring(0, opts.maxSectionLength) + '... [truncated]'
          : section.content;
        parts.push(truncated);
      }
      parts.push('');
    }
  } else if (source.text) {
    parts.push('## Full Text');
    parts.push(source.text.length > opts.maxSectionLength * 5
      ? source.text.substring(0, opts.maxSectionLength * 5) + '... [truncated]'
      : source.text);
  }

  return parts.join('\n');
}

/**
 * 提取要点：用于 AI 生成时聚焦
 */
export function extractKeyPoints(source: SourceContent, maxPoints = 8): string[] {
  const points: string[] = [];

  if (source.sections) {
    for (const section of source.sections) {
      if (section.heading) {
        points.push(section.heading);
        if (points.length >= maxPoints) break;
      }
    }
  }

  if (points.length === 0 && source.text) {
    // 从全文提取前几句作为要点
    const sentences = source.text
      .split(/[.。!?！？\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 200);
    return sentences.slice(0, maxPoints);
  }

  return points;
}

/** 工具：估算 source 文档可以生成的幻灯片数 */
export function estimateSlideCount(source: SourceContent): number {
  if (source.sections && source.sections.length > 0) {
    return Math.min(20, Math.max(3, source.sections.length));
  }
  const wordCount = source.text.split(/\s+/).length;
  return Math.min(20, Math.max(3, Math.round(wordCount / 200)));
}
