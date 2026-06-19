import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { getAPIKey, getProviderConfig } from '../ai/providers.js';
import type { TTSProvider, TTSRequest, TTSVoice } from './types.js';

/**
 * OpenAI TTS 提供器
 *
 * 优势：6 种高质量声音（alloy/echo/fable/onyx/nova/shimmer）
 * 价格：$15/1M 字符
 */
export class OpenAITTSProvider implements TTSProvider {
  name = 'openai' as const;

  async isAvailable(): Promise<boolean> {
    return !!getAPIKey('openai');
  }

  async listVoices(): Promise<TTSVoice[]> {
    return [
      { id: 'alloy', name: 'Alloy', language: 'en-US', gender: 'neutral' },
      { id: 'echo', name: 'Echo', language: 'en-US', gender: 'male' },
      { id: 'fable', name: 'Fable', language: 'en-GB', gender: 'neutral' },
      { id: 'onyx', name: 'Onyx', language: 'en-US', gender: 'male' },
      { id: 'nova', name: 'Nova', language: 'en-US', gender: 'female' },
      { id: 'shimmer', name: 'Shimmer', language: 'en-US', gender: 'female' },
    ];
  }

  async synthesize(request: TTSRequest): Promise<string> {
    const apiKey = getAPIKey('openai');
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Set OPENAI_API_KEY in .env');
    }

    await mkdir(dirname(request.outputPath), { recursive: true });

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: request.voice,
        input: request.text,
        speed: request.speed || 1.0,
        response_format: request.format || 'mp3',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS error: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(request.outputPath, buffer);
    return request.outputPath;
  }
}
