import { readFile } from 'fs/promises';
import { basename } from 'path';
import type { SourceContent, SourceParser, ParseOptions, SourceSection } from '../types.js';

/**
 * Markdown 解析器
 *
 * 使用 marked 解析 Markdown 文档，自动识别 Heading 层级。
 * 同时支持没有 marked 的回退（基于正则）。
 */
export class MarkdownParser implements SourceParser {
  extensions = ['.md', '.markdown', '.mdown'];

  async parse(filePath: string, options: ParseOptions = {}): Promise<SourceContent> {
    const { extractSections = true, maxLength = 200000 } = options;
    const raw = await readFile(filePath, 'utf-8');
    let text = raw;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '\n\n[Truncated]';
    }

    const sections = extractSections ? parseMarkdownSections(text) : undefined;
    const title =
      sections?.find(s => s.level === 1)?.heading ||
      basename(filePath).replace(/\.(md|markdown|mdown)$/i, '');

    const metadata: Record<string, any> = {
      fileSize: Buffer.byteLength(raw, 'utf-8'),
      lineCount: raw.split(/\r?\n/).length,
    };

    return {
      title,
      text,
      metadata,
      sections,
      sourceType: 'markdown',
    };
  }
}

/**
 * 解析 Markdown 段落（基于 ATX Heading 语法）
 */
function parseMarkdownSections(md: string): SourceSection[] {
  const lines = md.split(/\r?\n/);
  const sections: SourceSection[] = [];
  let current: SourceSection = { heading: '', content: '', level: 0 };

  const flush = () => {
    if (current.heading || current.content.trim()) {
      sections.push(current);
    }
    current = { heading: '', content: '', level: 0 };
  };

  for (const line of lines) {
    // 匹配 ATX 风格标题：# / ## / ### 等
    const headingMatch = line.match(/^(#{1,6})\s+(.*?)(?:\s+#+\s*)?$/);
    if (headingMatch) {
      flush();
      current.heading = headingMatch[2].trim();
      current.level = headingMatch[1].length;
      continue;
    }

    // 跳过代码块围栏
    if (line.match(/^```/)) {
      current.content += (current.content ? '\n' : '') + line;
      continue;
    }

    current.content += (current.content ? '\n' : '') + line;
  }
  flush();

  return sections.filter(s => s.heading || s.content.trim().length > 0);
}
