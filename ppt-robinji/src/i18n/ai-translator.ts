import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getAPIKey, getProviderConfig } from '../ai/providers.js';
import type { Translator, TranslateOptions } from './types.js';

/**
 * AI 翻译器
 *
 * 复用 AIGenerator 的 Provider 配置，使用 LLM 进行翻译。
 * 支持 OpenAI、Anthropic、OpenAI 兼容 API。
 */
export class AITranslator implements Translator {
  name = 'ai';
  private provider: string;

  constructor(provider: string = 'deepseek') {
    this.provider = provider;
  }

  async isAvailable(): Promise<boolean> {
    return !!getAPIKey(this.provider);
  }

  async translate(text: string, options: TranslateOptions): Promise<string> {
    const results = await this.translateBatch([text], options);
    return results[0];
  }

  async translateBatch(texts: string[], options: TranslateOptions): Promise<string[]> {
    const config = getProviderConfig(this.provider);
    if (!config) {
      throw new Error(`Unknown provider: ${this.provider}`);
    }
    const apiKey = getAPIKey(this.provider);
    if (!apiKey) {
      throw new Error(`API key not found for ${this.provider}`);
    }

    const prompt = this.buildPrompt(texts, options);

    if (config.type === 'anthropic') {
      return this.translateWithAnthropic(prompt, texts.length, apiKey, config.defaultModel);
    } else {
      return this.translateWithOpenAI(prompt, texts.length, apiKey, config.defaultModel, config.baseURL);
    }
  }

  private buildPrompt(texts: string[], options: TranslateOptions): string {
    const { source, target, glossary, style = 'formal', preservePlaceholders = true } = options;
    const langMap: Record<string, string> = {
      'zh-CN': 'Simplified Chinese (简体中文)',
      'zh-TW': 'Traditional Chinese (繁體中文)',
      'en-US': 'American English',
      'en-GB': 'British English',
      'ja-JP': 'Japanese (日本語)',
      'ko-KR': 'Korean (한국어)',
      'es-ES': 'Spanish (Español)',
      'fr-FR': 'French (Français)',
      'de-DE': 'German (Deutsch)',
    };
    const sourceLang = langMap[source] || source;
    const targetLang = langMap[target] || target;

    const glossaryText = glossary ? this.formatGlossary(glossary) : '';

    const styleGuide: Record<string, string> = {
      formal: 'Use formal, professional language suitable for business presentations.',
      casual: 'Use casual, friendly language suitable for informal talks.',
      technical: 'Use precise technical terminology. Preserve domain-specific terms.',
      marketing: 'Use persuasive, engaging language suitable for product marketing.',
    };

    return `You are a professional translator specializing in presentation content.
Translate the following texts from ${sourceLang} to ${targetLang}.

Style: ${styleGuide[style]}
${glossaryText}
${preservePlaceholders ? 'Preserve all placeholders like ${name}, {count}, %s, %d, etc.' : ''}

Output format: Return a JSON array of translated strings in the same order.
Example output: ["translated text 1", "translated text 2", "translated text 3"]

Input (JSON array):
${JSON.stringify(texts)}

Output (JSON array only, no explanation):`;
  }

  private formatGlossary(glossary: import('./types.js').Glossary): string {
    if (Array.isArray(glossary)) {
      return 'Glossary (use these exact translations):\n' +
        glossary.map(e => `  - ${e.source} → ${e.target}${e.context ? ` (${e.context})` : ''}`).join('\n');
    }
    return 'Glossary (use these exact translations):\n' +
      Object.entries(glossary).map(([k, v]) => `  - ${k} → ${v}`).join('\n');
  }

  private async translateWithAnthropic(
    prompt: string,
    count: number,
    apiKey: string,
    model: string
  ): Promise<string[]> {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response');
    return this.parseResponse(content.text, count);
  }

  private async translateWithOpenAI(
    prompt: string,
    count: number,
    apiKey: string,
    model: string,
    baseURL?: string
  ): Promise<string[]> {
    const client = baseURL ? new OpenAI({ apiKey, baseURL }) : new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response');
    return this.parseResponse(content, count);
  }

  private parseResponse(text: string, expectedCount: number): string[] {
    // 提取 JSON 数组
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) {
      // 容错：按行分割
      return text.split('\n').filter(Boolean).slice(0, expectedCount);
    }
    try {
      const arr = JSON.parse(match[0]);
      if (Array.isArray(arr) && arr.length === expectedCount) {
        return arr;
      }
      // 数量不匹配，返回尽可能多的
      return arr.slice(0, expectedCount);
    } catch {
      return text.split('\n').filter(Boolean).slice(0, expectedCount);
    }
  }
}

/**
 * 离线翻译器（基于词典的简单回退）
 *
 * 用于无 API key 时的降级方案。仅支持少量常见短语。
 */
export class OfflineTranslator implements Translator {
  name = 'offline';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async translate(text: string, options: TranslateOptions): Promise<string> {
    // 简化：仅做标识，不做实际翻译
    return `[${options.target}] ${text}`;
  }

  async translateBatch(texts: string[], options: TranslateOptions): Promise<string[]> {
    return texts.map(t => `[${options.target}] ${t}`);
  }
}
