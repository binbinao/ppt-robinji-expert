import type { PPTContent } from '../ai/generator.js';
import { AIGenerator } from '../ai/generator.js';
import { AITranslator, OfflineTranslator } from './ai-translator.js';
import type { BilingualContent, BilingualSlide, BilingualLayout, Language, Glossary, TranslateOptions } from './types.js';
import { buildBilingual, parseBilingualFromContent } from './builder.js';

/**
 * 双语生成器
 *
 * 工作流程：
 * 1. 用 AIGenerator 生成源语言 PPT
 * 2. 用 AITranslator 翻译为目标语言
 * 3. 合并为 BilingualContent
 * 4. 转为最终 PPTContent
 */
export class BilingualGenerator {
  private generator: AIGenerator;
  private translator: AITranslator | OfflineTranslator;
  private defaultProvider: string;

  constructor(provider: string = 'deepseek') {
    this.defaultProvider = provider;
    this.generator = new AIGenerator(provider);
    this.translator = new AITranslator(provider);
  }

  /**
   * 从主题生成双语 PPT
   */
  async generate(options: {
    topic: string;
    slides?: number;
    source?: Language;
    target?: Language;
    layout?: BilingualLayout;
    style?: 'professional' | 'creative' | 'minimal';
    structure?: 'ted' | 'pitch' | 'launch' | 'tutorial' | 'report';
    audience?: string;
    duration?: number;
    glossary?: Glossary;
    provider?: string;
  }): Promise<{ primary: PPTContent; secondary: PPTContent; bilingual: BilingualContent; final: PPTContent }> {
    const source = options.source || 'zh-CN';
    const target = options.target || 'en-US';
    const layout = options.layout || 'two-page';
    const provider = options.provider || this.defaultProvider;

    // 1. 生成源语言内容
    const primaryTopic = this.localizeTopic(options.topic, source);
    const primary = await this.generator.generateOutline({
      topic: primaryTopic,
      slides: options.slides,
      style: options.style,
      structure: options.structure,
      audience: options.audience,
      duration: options.duration,
    });

    // 2. 翻译为目标语言
    const secondary = await this.translateContent(primary, {
      source,
      target,
      glossary: options.glossary,
      provider,
    });

    // 3. 构建双语内容
    const bilingual = parseBilingualFromContent(primary, secondary, layout);
    bilingual.meta = {
      sourceLanguage: source,
      targetLanguage: target,
      generatedAt: new Date().toISOString(),
      glossary: options.glossary,
    };

    // 4. 合并为最终 PPT
    const final = buildBilingual(bilingual);

    return { primary, secondary, bilingual, final };
  }

  /**
   * 翻译现有 PPTContent
   */
  async translateContent(
    content: PPTContent,
    options: TranslateOptions & { provider?: string }
  ): Promise<PPTContent> {
    const provider = options.provider || this.defaultProvider;
    const translator = new AITranslator(provider);

    // 1. 翻译标题
    const newTitle = await translator.translate(content.title, options);

    // 2. 翻译副标题
    const newSubtitle = content.subtitle
      ? await translator.translate(content.subtitle, options)
      : undefined;

    // 3. 批量翻译每张 slide
    const newSlides: typeof content.slides = [];
    for (const slide of content.slides) {
      const newTitle = await translator.translate(slide.title, options);

      const newContent: string[] = [];
      for (const c of slide.content) {
        newContent.push(await translator.translate(c, options));
      }

      const newNotes = typeof slide.notes === 'string'
        ? await translator.translate(slide.notes, options)
        : slide.notes && (slide.notes as any).script
          ? { ...(slide.notes as any), script: await translator.translate((slide.notes as any).script, options) }
          : slide.notes;

      newSlides.push({
        ...slide,
        title: newTitle,
        content: newContent,
        notes: newNotes,
      });
    }

    return {
      title: newTitle,
      subtitle: newSubtitle,
      slides: newSlides,
      estimatedDuration: content.estimatedDuration,
      totalScriptLength: content.totalScriptLength,
    };
  }

  /**
   * 本地化主题（简单的语言识别）
   */
  private localizeTopic(topic: string, lang: Language): string {
    // 如果源语言是中文，但主题是英文，提示
    if (lang.startsWith('zh') && /^[a-zA-Z\s\d]+$/.test(topic)) {
      console.warn(`[bilingual] Topic looks English, but source is ${lang}`);
    }
    return topic;
  }
}

export { AITranslator, OfflineTranslator };
export * from './types.js';
export { buildBilingual, parseBilingualFromContent, createGlossary, loadGlossary } from './builder.js';
