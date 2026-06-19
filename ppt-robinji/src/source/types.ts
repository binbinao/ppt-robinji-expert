/**
 * Source 解析器类型定义
 *
 * 为 ppt-robinji 提供统一的源文档解析接口。
 * 支持 PDF / DOCX / Markdown / 纯文本 等格式。
 */

/** 文档中的结构化段落 */
export interface SourceSection {
  /** 段落标题（Markdown 的 #、Word 的 Heading 等） */
  heading: string;
  /** 段落正文（多行文本） */
  content: string;
  /** 段落级别（1=H1, 2=H2 ... 0=无标题） */
  level: number;
}

/** 解析后的源文档内容 */
export interface SourceContent {
  /** 文档标题（来自首个 Heading 或文件名） */
  title: string;
  /** 完整纯文本内容 */
  text: string;
  /** 文档元数据（页数、字数、作者等） */
  metadata: Record<string, any>;
  /** 结构化段落（如果有） */
  sections?: SourceSection[];
  /** 推测的源文件类型 */
  sourceType: 'pdf' | 'docx' | 'markdown' | 'text' | 'unknown';
}

/** 源文件解析器接口 */
export interface SourceParser {
  /** 该解析器支持的扩展名 */
  extensions: string[];
  /** 解析文件 */
  parse(filePath: string): Promise<SourceContent>;
}

/** 解析选项 */
export interface ParseOptions {
  /** 解析为结构化段落（影响 sections 字段输出） */
  extractSections?: boolean;
  /** 最大文本长度（截断防止 OOM） */
  maxLength?: number;
}
