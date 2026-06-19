import { readFile } from 'fs/promises';
import { basename } from 'path';
import type { SourceContent, SourceParser, ParseOptions, SourceSection } from '../types.js';

/**
 * 纯文本解析器
 *
 * 支持 .txt 文件。
 * 使用空行分段、首行非空且较短时作为标题启发。
 */
export class TextParser implements SourceParser {
  extensions = ['.txt'];

  async parse(filePath: string, options: ParseOptions = {}): Promise<SourceContent> {
    const { extractSections = true, maxLength = 200000 } = options;
    const raw = await readFile(filePath, 'utf-8');
    let text = raw;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '\n\n[Truncated]';
    }

    const lines = text.split(/\r?\n/);
    const firstNonEmpty = lines.find(l => l.trim());
    const title =
      firstNonEmpty && firstNonEmpty.trim().length < 100
        ? firstNonEmpty.trim()
        : basename(filePath, '.txt');

    const sections = extractSections ? splitByBlankLine(text) : undefined;

    const metadata: Record<string, any> = {
      fileSize: Buffer.byteLength(raw, 'utf-8'),
      lineCount: lines.length,
    };

    return {
      title,
      text,
      metadata,
      sections,
      sourceType: 'text',
    };
  }
}

function splitByBlankLine(text: string): SourceSection[] {
  const blocks = text.split(/\r?\n\s*\r?\n/);
  return blocks
    .map(b => b.trim())
    .filter(Boolean)
    .map(content => ({ heading: '', content, level: 0 }));
}
