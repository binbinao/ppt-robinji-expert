import { extname } from 'path';
import type { SourceParser, SourceContent, ParseOptions } from './types.js';
import { PDFParser } from './parsers/pdf.js';
import { DOCXParser } from './parsers/docx.js';
import { MarkdownParser } from './parsers/markdown.js';
import { TextParser } from './parsers/text.js';

export * from './types.js';
export { PDFParser, DOCXParser, MarkdownParser, TextParser };
export { sourceToPromptText, extractKeyPoints, estimateSlideCount } from './to-prompt.js';

/**
 * 解析器工厂：自动根据文件扩展名选择合适的解析器
 */
export class SourceParserFactory {
  private parsers: SourceParser[];

  constructor() {
    this.parsers = [
      new PDFParser(),
      new DOCXParser(),
      new MarkdownParser(),
      new TextParser(),
    ];
  }

  /**
   * 选择可解析该文件的解析器
   */
  selectParser(filePath: string): SourceParser | undefined {
    const ext = extname(filePath).toLowerCase();
    return this.parsers.find(p => p.extensions.includes(ext));
  }

  /**
   * 解析任意支持的源文件
   */
  async parse(filePath: string, options: ParseOptions = {}): Promise<SourceContent> {
    const parser = this.selectParser(filePath);
    if (!parser) {
      throw new Error(
        `No parser found for ${filePath}. Supported: .pdf, .docx, .md, .markdown, .txt`
      );
    }
    return parser.parse(filePath, options);
  }

  /**
   * 判断文件是否可被解析
   */
  canParse(filePath: string): boolean {
    return !!this.selectParser(filePath);
  }
}

const defaultFactory = new SourceParserFactory();

/** 便捷方法：解析任意源文件 */
export async function parseSourceFile(
  filePath: string,
  options?: ParseOptions
): Promise<SourceContent> {
  return defaultFactory.parse(filePath, options);
}

/** 便捷方法：判断文件类型 */
export function canParseSourceFile(filePath: string): boolean {
  return defaultFactory.canParse(filePath);
}
