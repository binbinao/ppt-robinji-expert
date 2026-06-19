import type { SlideContent, PPTContent } from '../ai/generator.js';
import type { BilingualContent, BilingualSlide, BilingualLayout, Language, Glossary } from './types.js';

/**
 * 双语 PPT 构建器
 *
 * 将双语内容转为可在 PPTCreator 中使用的 PPTContent
 */

/**
 * 合并 BilingualContent 为单一 PPTContent（双栏布局）
 */
export function buildTwoColumnLayout(content: BilingualContent): PPTContent {
  const slides: SlideContent[] = [];

  for (let i = 0; i < content.slides.length; i++) {
    const bs = content.slides[i];
    const combined: SlideContent = {
      title: `${bs.primary.title} | ${bs.secondary.title}`,
      type: 'two-column',
      content: [
        ...bs.primary.content.map(c => `[ZH] ${c}`),
        '---',
        ...bs.secondary.content.map(c => `[EN] ${c}`),
      ],
      notes: `中文: ${(typeof bs.primary.notes === 'string' ? bs.primary.notes : (bs.primary.notes as any)?.script) || ''}\n\n` +
             `English: ${(typeof bs.secondary.notes === 'string' ? bs.secondary.notes : (bs.secondary.notes as any)?.script) || ''}`,
    };
    slides.push(combined);
  }

  return {
    title: `${content.primaryTitle} | ${content.secondaryTitle}`,
    slides,
  };
}

/**
 * 合并 BilingualContent 为双页（中文 + 英文交替）
 */
export function buildTwoPageLayout(content: BilingualContent): PPTContent {
  const slides: SlideContent[] = [];

  for (let i = 0; i < content.slides.length; i++) {
    const bs = content.slides[i];
    // 第一个 slide 是中文版
    slides.push(bs.primary);
    // 第二个 slide 是英文版
    slides.push(bs.secondary);
  }

  return {
    title: content.primaryTitle,
    subtitle: content.secondaryTitle,
    slides,
  };
}

/**
 * 合并 BilingualContent 为字幕式（主语言 + 字幕）
 */
export function buildSubtitleLayout(content: BilingualContent): PPTContent {
  const slides: SlideContent[] = [];

  for (let i = 0; i < content.slides.length; i++) {
    const bs = content.slides[i];
    // 副标题字段用于英文
    slides.push({
      ...bs.primary,
      subtitle: bs.secondary.title,
      content: bs.primary.content,
    });
  }

  return {
    title: content.primaryTitle,
    subtitle: content.secondaryTitle,
    slides,
  };
}

/**
 * 交错布局（中英交替每个 bullet）
 */
export function buildInterleavedLayout(content: BilingualContent): PPTContent {
  const slides: SlideContent[] = [];

  for (let i = 0; i < content.slides.length; i++) {
    const bs = content.slides[i];
    const interleaved: string[] = [];
    const maxLen = Math.max(bs.primary.content.length, bs.secondary.content.length);
    for (let j = 0; j < maxLen; j++) {
      if (j < bs.primary.content.length) interleaved.push(bs.primary.content[j]);
      if (j < bs.secondary.content.length) interleaved.push(bs.secondary.content[j]);
    }
    slides.push({
      title: bs.primary.title,
      type: bs.primary.type,
      content: interleaved,
    });
  }

  return {
    title: content.primaryTitle,
    subtitle: content.secondaryTitle,
    slides,
  };
}

/**
 * 主入口：根据 layout 选择构建器
 */
export function buildBilingual(content: BilingualContent): PPTContent {
  switch (content.layout) {
    case 'two-column':
      return buildTwoColumnLayout(content);
    case 'two-page':
      return buildTwoPageLayout(content);
    case 'subtitle':
      return buildSubtitleLayout(content);
    case 'interleaved':
      return buildInterleavedLayout(content);
    default:
      return buildTwoPageLayout(content);
  }
}

/**
 * 将 PPTContent 转为 BilingualContent（假设每张 slide 已有双语）
 * 用于后处理
 */
export function parseBilingualFromContent(
  primaryContent: PPTContent,
  secondaryContent: PPTContent,
  layout: BilingualLayout = 'two-page'
): BilingualContent {
  const slides: BilingualSlide[] = [];
  const len = Math.min(primaryContent.slides.length, secondaryContent.slides.length);
  for (let i = 0; i < len; i++) {
    slides.push({
      primary: primaryContent.slides[i],
      secondary: secondaryContent.slides[i],
    });
  }
  return {
    primaryTitle: primaryContent.title,
    secondaryTitle: secondaryContent.title,
    slides,
    layout,
    meta: {
      sourceLanguage: 'zh-CN',
      targetLanguage: 'en-US',
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * 创建空白术语表
 */
export function createGlossary(): Glossary {
  return {};
}

/**
 * 从 JSON 加载术语表
 */
export function loadGlossary(json: string): Glossary {
  return JSON.parse(json);
}
