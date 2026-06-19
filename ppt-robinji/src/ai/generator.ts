import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import {
  getProviderConfig,
  getAPIKey,
  getDefaultProvider,
  type ProviderConfig,
  type ProviderType
} from './providers.js';
import { SPEECH_PROMPT_PREFIX, SPEECH_PROMPT_SUFFIX } from './speech-methodology.js';

export interface PPTContent {
  title: string;
  subtitle?: string;
  slides: SlideContent[];
  estimatedDuration?: number;
  totalScriptLength?: number;
}

export interface SpeakerNotes {
  script: string;
  duration?: number;
  keyPoints?: string[];
  interaction?: string;
  dataSource?: string;
}

export interface SlideContent {
  title: string;
  type: 'cover' | 'agenda' | 'content' | 'kpi' | 'quote' | 'comparison'
      | 'process' | 'timeline' | 'divider' | 'chart' | 'conclusion'
      | 'cta' | 'qa' | 'thank-you' | 'title' | 'image' | 'two-column';
  content: string[];
  notes?: string | SpeakerNotes;
  kpiValue?: string;
  kpiUnit?: string;
  kpiContext?: string;
  quoteAuthor?: string;
  quoteSource?: string;
  comparisonA?: { title: string; items: string[] };
  comparisonB?: { title: string; items: string[] };
  steps?: Array<{ title: string; description: string }>;
  events?: Array<{ date: string; title: string; description: string }>;
  chartData?: {
    type: 'bar' | 'line' | 'pie' | 'area';
    title: string;
    labels: string[];
    values: number[];
  };
  imageQuery?: string;
  imagePrompt?: string;
  imageUrl?: string;
  imagePosition?: 'left' | 'right' | 'top' | 'bottom';
  imageSource?: 'search' | 'generate' | 'random';
}

export interface GenerateOptions {
  topic: string;
  slides?: number;
  style?: 'professional' | 'creative' | 'minimal' | 'persuasive' | 'academic';
  provider?: string;
  structure?: 'ted' | 'pitch' | 'launch' | 'tutorial' | 'report';
  audience?: string;
  duration?: number;
  /**
   * 源文档内容（来自 SourceParser.parse()）。
   * 传入后将作为生成大纲的素材。
   */
  sourceContent?: import('../source/index.js').SourceContent;
}

export class AIGenerator {
  private provider: string;
  private config: ProviderConfig;
  private providerType: ProviderType;
  private anthropic?: Anthropic;
  private openai?: OpenAI;

  constructor(provider?: string) {
    this.provider = provider || getDefaultProvider();
    this.config = getProviderConfig(this.provider)!;

    if (!this.config) {
      throw new Error(`Unknown provider: ${this.provider}`);
    }

    this.providerType = this.config.type;
    this.initializeClient();
  }

  private initializeClient() {
    const apiKey = getAPIKey(this.provider);

    if (!apiKey) {
      throw new Error(
        `API key not found for provider: ${this.provider}. ` +
        `Please set ${this.config.apiKeyEnv} in .env (or use PROVIDER env var to switch)`
      );
    }

    switch (this.providerType) {
      case 'anthropic':
        this.anthropic = new Anthropic({ apiKey });
        break;
      case 'openai':
        this.openai = new OpenAI({ apiKey });
        break;
      case 'openai-compatible':
        if (!this.config.baseURL) {
          throw new Error(`Provider ${this.provider} requires baseURL in config`);
        }
        this.openai = new OpenAI({
          apiKey,
          baseURL: this.config.baseURL
        });
        break;
      default:
        throw new Error(`Unsupported provider type: ${this.providerType}`);
    }
  }

  async generateOutline(options: GenerateOptions): Promise<PPTContent> {
    const prompt = this.buildPrompt(options);

    switch (this.providerType) {
      case 'anthropic':
        return this.generateWithAnthropic(prompt);
      case 'openai':
      case 'openai-compatible':
        return this.generateWithOpenAI(prompt);
      default:
        throw new Error(`Unsupported provider type: ${this.providerType}`);
    }
  }

  private buildPrompt(options: GenerateOptions): string {
    const slideCount = options.slides || 8;
    const style = options.style || 'professional';
    const structure = options.structure || 'ted';
    const audience = options.audience || 'mixed';
    const duration = options.duration || Math.max(5, slideCount * 1.5);

    const structureGuide = this.getStructureGuide(structure, slideCount);

    // 如果提供了源文档内容，注入到 prompt
    let sourceBlock = '';
    if (options.sourceContent) {
      // 动态 import 避免循环依赖
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { sourceToPromptText } = require('../source/to-prompt.js') as typeof import('../source/to-prompt.js');
      sourceBlock = `\n\n# Source Material\n\nThe following document should be summarized into a presentation:\n\n${sourceToPromptText(options.sourceContent)}`;
    }

    return `${SPEECH_PROMPT_PREFIX}

Topic: ${options.topic}
Slides: ${slideCount} (target duration: ${duration} min)
Style: ${style}
Audience: ${audience}
Structure: ${structure}
${sourceBlock}

${structureGuide}

For each slide, output in this JSON format:
{
  "title": "Main PPT Title",
  "subtitle": "Subtitle (optional)",
  "estimatedDuration": ${duration},
  "slides": [
    {
      "title": "TAKEAWAY STATEMENT (not topic)",
      "type": "cover|agenda|content|kpi|quote|comparison|process|timeline|divider|chart|conclusion|cta|qa|thank-you",
      "content": ["Short point 1", "Short point 2"],
      "notes": "[PAUSE] Full speech script here... [EMPHASIS] on key words...",
      "imageQuery": "English image search keywords",
      "imagePrompt": "Detailed English AI image generation prompt",
      "imagePosition": "right",
      "kpiValue": "500M+",
      "kpiUnit": "users",
      "kpiContext": "Global AI users in 2026",
      "quoteAuthor": "Name, Title",
      "quoteSource": "Source/Year"
    }
  ]
}

${SPEECH_PROMPT_SUFFIX}`;
  }

  private getStructureGuide(structure: string, slideCount: number): string {
    const guides: { [key: string]: string } = {
      ted: `TED TALK STRUCTURE (recommended):
1. cover - Hook with shocking stat or personal story
2. agenda - 3-4 main points roadmap
3. content - The main idea explained
4. kpi - ONE hero number that proves the point
5. content - Supporting evidence / examples
6. process - How it works (3-5 steps)
7. content - What it means for the audience
8. cta - What you want them to do NOW`,

      pitch: `INVESTOR PITCH STRUCTURE:
1. cover - Company + one-liner value prop
2. agenda - 5 sections roadmap
3. content - Problem (pain point)
4. kpi - Market size (TAM/SAM/SOM)
5. content - Solution
6. kpi - Traction metrics (users/revenue/growth)
7. content - Business model
8. content - Competition
9. content - Team
10. cta - Ask (raise amount + use of funds)`,

      launch: `PRODUCT LAUNCH STRUCTURE:
1. cover - Product name + tagline
2. content - Why we built this (user pain)
3. kpi - User research scale (e.g., "10K+ interviews")
4. content - What it is (demo description)
5. content - Key features (3-4 max)
6. comparison - Old way vs New way
7. kpi - Performance gain (e.g., "10x faster")
8. content - Pricing/availability
9. cta - Sign up / pre-order now`,

      tutorial: `TUTORIAL/HOW-TO STRUCTURE:
1. cover - What you'll learn
2. agenda - 3-5 steps roadmap
3. content - Prerequisites
4. process - Step 1
5. process - Step 2
6. process - Step 3
7. content - Common mistakes
8. content - Next steps
9. qa - Questions?`,

      report: `BUSINESS REPORT STRUCTURE:
1. cover - Report title + period
2. agenda - Sections
3. kpi - Headline number
4. content - Highlights
5. chart - Performance data
6. content - Analysis
7. content - Challenges
8. content - Outlook
9. cta - Recommended actions`
    };
    return guides[structure] || guides.ted;
  }

  private async generateWithAnthropic(prompt: string): Promise<PPTContent> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');

    const response = await this.anthropic.messages.create({
      model: this.config.defaultModel,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    return this.parseJSONResponse(content.text);
  }

  private async generateWithOpenAI(prompt: string): Promise<PPTContent> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const response = await this.openai.chat.completions.create({
      model: this.config.defaultModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI-compatible API');
    }

    return this.parseJSONResponse(content);
  }

  private parseJSONResponse(text: string): PPTContent {
    // 1. 优先匹配 markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (e) {
        // 继续尝试
      }
    }

    // 2. 提取 JSON 对象（最长匹配）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    let jsonStr = jsonMatch[0];

    // 3. 尝试直接解析
    try {
      return this.parseAndEnrich(jsonStr);
    } catch (firstError) {
      // 4. 容错：找到最后一个完整的 }, 结束位置
      const lastCompleteSlide = jsonStr.lastIndexOf('},');
      if (lastCompleteSlide > 0) {
        const truncated = jsonStr.substring(0, lastCompleteSlide + 1) + ']}';
        try {
          return this.parseAndEnrich(truncated);
        } catch (e) {
          // 继续
        }
      }

      console.error('Failed to parse JSON (first 500 chars):', jsonStr.substring(0, 500));
      throw new Error(`Invalid JSON in AI response: ${(firstError as Error).message}`);
    }
  }

  private parseAndEnrich(jsonStr: string): PPTContent {
    const content = JSON.parse(jsonStr) as PPTContent;

    // 计算总脚本长度
    if (content.slides) {
      content.totalScriptLength = content.slides.reduce((sum, s) => {
        const notes = s.notes;
        if (typeof notes === 'string') return sum + notes.length;
        if (notes && typeof notes === 'object' && 'script' in notes) {
          return sum + (notes.script?.length || 0);
        }
        return sum;
      }, 0);

      // 估算演讲时长
      if (content.totalScriptLength > 0) {
        const sampleText = content.slides
          .map(s => typeof s.notes === 'string' ? s.notes :
                   (s.notes as any)?.script || '')
          .join('');
        const chineseChars = (sampleText.match(/[\u4e00-\u9fa5]/g) || []).length;
        const totalChars = sampleText.length;
        const chineseRatio = chineseChars / Math.max(totalChars, 1);

        if (chineseRatio > 0.5) {
          content.estimatedDuration = Math.round(content.totalScriptLength / 220 * 10) / 10;
        } else {
          const wordCount = sampleText.split(/\s+/).length;
          content.estimatedDuration = Math.round(wordCount / 140 * 10) / 10;
        }
      }
    }
    return content;
  }
}

export default AIGenerator;
