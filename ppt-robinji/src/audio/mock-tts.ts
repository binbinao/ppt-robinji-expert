import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { TTSProvider, TTSRequest, TTSVoice } from './types.js';

/**
 * Mock TTS 提供器
 *
 * 用于测试和离线场景。生成静音 WAV 文件。
 */
export class MockTTSProvider implements TTSProvider {
  name = 'mock' as const;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async listVoices(): Promise<TTSVoice[]> {
    return [
      { id: 'mock-zh', name: 'Mock Chinese', language: 'zh-CN', gender: 'female' },
      { id: 'mock-en', name: 'Mock English', language: 'en-US', gender: 'female' },
    ];
  }

  async synthesize(request: TTSRequest): Promise<string> {
    await mkdir(dirname(request.outputPath), { recursive: true });
    // 生成最小 WAV（44 字节头 + 静音）
    const wav = this.createSilentWav(1, 8000, 0.1);
    await writeFile(request.outputPath, wav);
    return request.outputPath;
  }

  /** 创建静音 WAV 文件 */
  private createSilentWav(channels: number, sampleRate: number, durationSec: number): Buffer {
    const numSamples = Math.floor(sampleRate * durationSec);
    const dataSize = numSamples * channels * 2; // 16-bit
    const buffer = Buffer.alloc(44 + dataSize);
    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // fmt size
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(channels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * channels * 2, 28); // byte rate
    buffer.writeUInt16LE(channels * 2, 32); // block align
    buffer.writeUInt16LE(16, 34); // bits per sample
    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    return buffer;
  }
}
