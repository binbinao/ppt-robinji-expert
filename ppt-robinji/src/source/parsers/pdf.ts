import { readFile } from 'fs/promises';
import { basename } from 'path';
import type { SourceContent, SourceParser, ParseOptions, SourceSection } from '../types.js';

/**
 * PDF 解析器
 *
 * 使用 pdf-parse 提取 PDF 中的文本。
 * 注意：pdf-parse 是同步 API，我们包装为异步以保持接口一致。
 */
export class PDFParser implements SourceParser {
  extensions = ['.pdf'];

  async parse(filePath: string, options: ParseOptions = {}): Promise<SourceContent> {
    const { extractSections = true, maxLength = 200000 } = options;
    const dataBuffer = await readFile(filePath);

    // 动态 require 以避免 pdf-parse 在测试时启动 db 调试
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdf = (await import('pdf-parse')).default as (buf: Buffer) => Promise<{
      text: string;
      numpages: number;
      info: Record<string, any>;
      metadata?: any;
    }>;

    const result = await pdf(dataBuffer);

    let text = result.text || '';
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '\n\n[Truncated]';
    }

    const title =
      (result.info && (result.info.Title || result.info.title)) ||
      basename(filePath, '.pdf');

    const metadata: Record<string, any> = {
      pages: result.numpages,
      author: result.info?.Author,
      creationDate: result.info?.CreationDate,
      fileSize: dataBuffer.length,
    };

    const sections = extractSections ? extractPdfSections(text) : undefined;

    return {
      title,
      text,
      metadata,
      sections,
      sourceType: 'pdf',
    };
  }
}

/**
 * 从 PDF 文本中粗略提取段落结构
 * PDF 没有原生 Heading，我们用大写段落 / 短行作为启发
 */
function extractPdfSections(text: string): SourceSection[] {
  const sections: SourceSection[] = [];
  const lines = text.split(/\r?\n/);

  let current: SourceSection = { heading: '', content: '', level: 0 };
  const flush = () => {
    if (current.heading || current.content.trim()) {
      sections.push(current);
    }
    current = { heading: '', content: '', level: 0 };
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current.content) current.content += '\n';
      continue;
    }

    // 启发规则：短行 + 全大写 + 不以句末标点结尾
    const isShort = trimmed.length < 80;
    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
    const noEndPunct = !/[.!?。！？;；]$/.test(trimmed);

    if (isShort && (isAllCaps || (noEndPunct && trimmed.split(/\s+/).length <= 6))) {
      flush();
      current.heading = trimmed;
      current.level = 1;
    } else {
      current.content += (current.content ? '\n' : '') + trimmed;
    }
  }
  flush();
  return sections.filter(s => s.heading || s.content.length > 20);
}
