import { config } from 'dotenv';
import { AIGenerator } from './ai/index.js';
import { PPTCreator } from './pptx/index.js';
import { Converter } from './converter/index.js';
import logger from './utils/logger.js';

// 加载环境变量
config();

export interface GeneratePPTOptions {
  topic: string;
  slides?: number;
  style?: 'professional' | 'creative' | 'minimal';
  provider?: string;
  outputPath?: string;
  palette?: string;
  /**
   * 从源文档生成（PDF/DOCX/Markdown/TXT）。
   * 传入文件路径，自动解析并注入 AI 提示。
   */
  from?: string;
}

export interface ConvertOptions {
  inputPath: string;
  outputPath?: string;
  to: 'pdf' | 'images';
  resolution?: number;
}

/**
 * Main class for ppt-robinji skill
 */
export class PPTRobinji {
  private generator: AIGenerator;
  private converter: Converter;

  constructor(provider?: string) {
    this.generator = new AIGenerator(provider);
    this.converter = new Converter();
  }

  /**
   * Generate and create a PPT from a topic
   */
  async generatePPT(options: GeneratePPTOptions): Promise<string> {
    logger.info(`Generating PPT for topic: ${options.topic}`);

    // 0. 如果指定了源文档，先解析
    let sourceContent: any | undefined;
    if (options.from) {
      const { parseSourceFile, estimateSlideCount } = await import('./source/index.js');
      logger.info(`Parsing source file: ${options.from}`);
      sourceContent = await parseSourceFile(options.from);
      logger.info(
        `Source parsed: ${sourceContent.sourceType}, ` +
        `${sourceContent.sections?.length || 0} sections, ` +
        `${sourceContent.text.length} chars`
      );
      // 如果未指定 slides 数，根据源文档自动估算
      if (!options.slides) {
        options.slides = estimateSlideCount(sourceContent);
        logger.info(`Auto-estimated ${options.slides} slides from source`);
      }
    }

    // 1. 使用AI生成内容大纲
    const content = await this.generator.generateOutline({
      topic: options.topic,
      slides: options.slides,
      style: options.style,
      sourceContent
    } as any);

    logger.info(`Generated outline with ${content.slides.length} slides`);

    // 2. 创建PPT文件
    const creator = new PPTCreator({ palette: options.palette });
    await creator.createFromOutline(content);

    // 3. 保存文件
    const outputPath = options.outputPath || './output/presentation.pptx';
    await creator.save(outputPath);

    logger.info(`PPT saved to: ${outputPath}`);
    return outputPath;
  }

  /**
   * Convert PPT to other formats
   */
  async convert(options: ConvertOptions): Promise<string> {
    logger.info(`Converting ${options.inputPath} to ${options.to}`);

    if (options.to === 'pdf') {
      const outputPath = options.outputPath || options.inputPath.replace(/\.pptx$/, '.pdf');
      await this.converter.toPDF(options.inputPath, outputPath);
      return outputPath;
    } else {
      const outputDir = options.outputPath || './output/images';
      const images = await this.converter.toImages(options.inputPath, outputDir);
      return images[0]; // 返回第一张图片
    }
  }

  /**
   * Check if required dependencies are installed
   */
  async checkDependencies() {
    return this.converter.checkDependencies();
  }
}

// 导出便捷函数
export async function generatePPT(options: GeneratePPTOptions): Promise<string> {
  const app = new PPTRobinji(options.provider);
  return app.generatePPT(options);
}

export async function convertPPT(options: ConvertOptions): Promise<string> {
  const app = new PPTRobinji();
  return app.convert(options);
}

export default PPTRobinji;
