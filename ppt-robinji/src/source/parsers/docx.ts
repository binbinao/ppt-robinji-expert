import { readFile } from 'fs/promises';
import { basename } from 'path';
import type { SourceContent, SourceParser, ParseOptions, SourceSection } from '../types.js';

/**
 * DOCX 解析器
 *
 * 使用 mammoth 提取 Word 文档的纯文本和 Heading 层级。
 */
export class DOCXParser implements SourceParser {
  extensions = ['.docx'];

  async parse(filePath: string, options: ParseOptions = {}): Promise<SourceContent> {
    const { extractSections = true, maxLength = 200000 } = options;
    const buffer = await readFile(filePath);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mammoth = (await import('mammoth')).default as any;

    // 提取纯文本
    const textResult = await mammoth.extractRawText({ buffer });
    let text: string = textResult.value || '';
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '\n\n[Truncated]';
    }

    // 提取 HTML 以便识别 Heading
    let sections: SourceSection[] | undefined;
    let title = basename(filePath, '.docx');

    if (extractSections) {
      const htmlResult = await mammoth.convertToHtml({ buffer });
      const sectionsAndTitle = extractSectionsFromHtml(htmlResult.value, title);
      sections = sectionsAndTitle.sections;
      title = sectionsAndTitle.title;
    }

    const messages = textResult.messages || [];
    const metadata: Record<string, any> = {
      warnings: messages.filter((m: any) => m.type === 'warning').length,
      fileSize: buffer.length,
    };

    return {
      title,
      text,
      metadata,
      sections,
      sourceType: 'docx',
    };
  }
}

/**
 * 从 mammoth 输出的 HTML 中解析 Heading 段落
 */
function extractSectionsFromHtml(html: string, defaultTitle: string): { sections: SourceSection[]; title: string } {
  const sections: SourceSection[] = [];
  // 简单正则：匹配 h1 - h6
  const headingRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const headingMatches: Array<{ level: number; text: string; index: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = headingRegex.exec(html)) !== null) {
    headingMatches.push({
      level: parseInt(m[1], 10),
      text: stripTags(m[2]).trim(),
      index: m.index,
    });
  }

  // 如果没有 Heading，尝试用段落
  if (headingMatches.length === 0) {
    return { sections: extractFromParagraphs(html), title: defaultTitle };
  }

  // 提取 Heading 之间的内容
  for (let i = 0; i < headingMatches.length; i++) {
    const h = headingMatches[i];
    const next = headingMatches[i + 1];
    const startIdx = h.index + html.substring(h.index).indexOf('</h') + 4;
    const endIdx = next ? next.index : html.length;
    const contentHtml = html.substring(startIdx, endIdx);
    const plain = htmlToPlainText(contentHtml).trim();
    sections.push({ heading: h.text, content: plain, level: h.level });
  }

  return { sections, title: headingMatches[0]?.text || defaultTitle };
}

function extractFromParagraphs(html: string): SourceSection[] {
  const sections: SourceSection[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = pRegex.exec(html)) !== null) {
    const text = stripTags(m[1]).trim();
    if (text) {
      sections.push({ heading: '', content: text, level: 0 });
    }
  }
  return sections;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/?(p|div|br|li)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
