import { mkdir } from 'fs/promises';
import { join } from 'path';
import { EdgeTTSProvider } from './edge-tts.js';
import { OpenAITTSProvider } from './openai-tts.js';
import { OfflineTTSProvider } from './offline-tts.js';
import { MockTTSProvider } from './mock-tts.js';
import type { TTSProvider, TTSRequest, TTSVoice, SpeakerNotesWithAudio } from './types.js';

/**
 * TTS 管理器
 *
 * 自动选择最佳可用的 TTS 提供器
 */
export class TTSManager {
  private providers: TTSProvider[];

  constructor() {
    this.providers = [
      new EdgeTTSProvider(),
      new OpenAITTSProvider(),
      new OfflineTTSProvider(),
      new MockTTSProvider(), // 兜底
    ];
  }

  /**
   * 获取最佳可用的 TTS 提供器
   */
  async getBestProvider(): Promise<TTSProvider> {
    for (const p of this.providers) {
      if (await p.isAvailable()) {
        return p;
      }
    }
    return this.providers[this.providers.length - 1]; // mock 兜底
  }

  /**
   * 获取指定名称的提供器
   */
  async getProvider(name: 'edge' | 'openai' | 'offline' | 'mock'): Promise<TTSProvider | undefined> {
    for (const p of this.providers) {
      if (p.name === name) {
        if (await p.isAvailable()) return p;
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * 列出所有可用提供器
   */
  async listAvailable(): Promise<TTSProvider[]> {
    const available: TTSProvider[] = [];
    for (const p of this.providers) {
      if (await p.isAvailable()) available.push(p);
    }
    return available;
  }

  /**
   * 批量合成演讲备注音频
   */
  async generateSpeakerAudio(
    notes: SpeakerNotesWithAudio[],
    outputDir: string,
    options: { provider?: 'edge' | 'openai' | 'offline' | 'mock'; voice?: string; speed?: number } = {}
  ): Promise<string[]> {
    const provider = options.provider
      ? await this.getProvider(options.provider)
      : await this.getBestProvider();

    if (!provider) {
      throw new Error(`TTS provider "${options.provider}" is not available`);
    }

    await mkdir(outputDir, { recursive: true });

    const paths: string[] = [];
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (!n.script || n.script.trim().length === 0) {
        paths.push('');
        continue;
      }

      const voice = n.audio?.voice || options.voice || (await this.getDefaultVoice(provider));
      const outputPath = join(outputDir, `slide-${i + 1}.mp3`);

      const req: TTSRequest = {
        text: n.script,
        voice,
        speed: n.audio?.speed || options.speed || 1.0,
        format: 'mp3',
        outputPath,
      };

      try {
        await provider.synthesize(req);
        paths.push(outputPath);
      } catch (e) {
        // 单个失败不阻塞其他
        console.warn(`TTS failed for slide ${i + 1}: ${(e as Error).message}`);
        paths.push('');
      }
    }

    return paths;
  }

  private async getDefaultVoice(provider: TTSProvider): Promise<string> {
    const voices = await provider.listVoices();
    if (voices.length === 0) return 'default';
    return voices[0].id;
  }
}

export {
  EdgeTTSProvider,
  OpenAITTSProvider,
  OfflineTTSProvider,
  MockTTSProvider,
};
export * from './types.js';
