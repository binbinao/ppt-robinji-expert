import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { TTSProvider, TTSRequest, TTSVoice } from './types.js';

/**
 * Microsoft Edge TTS 提供器
 *
 * 使用 node-edge-tts 库调用免费的 Edge TTS 服务。
 * 优势：100+ 语音、免费、无需 API key
 *
 * 热门中文语音：
 * - zh-CN-XiaoxiaoNeural (女)
 * - zh-CN-YunxiNeural (男)
 * - zh-CN-YunjianNeural (男)
 *
 * 热门英文语音：
 * - en-US-JennyNeural (女)
 * - en-US-GuyNeural (男)
 * - en-US-AriaNeural (女)
 */
export class EdgeTTSProvider implements TTSProvider {
  name = 'edge' as const;

  async isAvailable(): Promise<boolean> {
    try {
      // 尝试加载 node-edge-tts
      await import('node-edge-tts');
      return true;
    } catch {
      return false;
    }
  }

  async listVoices(): Promise<TTSVoice[]> {
    // 内置常用语音列表（避免每次调用远程 API）
    return [
      { id: 'zh-CN-XiaoxiaoNeural', name: 'Xiaoxiao (晓晓)', language: 'zh-CN', gender: 'female' },
      { id: 'zh-CN-YunxiNeural', name: 'Yunxi (云希)', language: 'zh-CN', gender: 'male' },
      { id: 'zh-CN-YunjianNeural', name: 'Yunjian (云健)', language: 'zh-CN', gender: 'male' },
      { id: 'zh-CN-XiaoyiNeural', name: 'Xiaoyi (晓伊)', language: 'zh-CN', gender: 'female' },
      { id: 'zh-CN-YunyangNeural', name: 'Yunyang (云扬)', language: 'zh-CN', gender: 'male' },
      { id: 'zh-CN-liaoning-XiaobeiNeural', name: 'Xiaobei (晓北)', language: 'zh-CN-LN', gender: 'female' },
      { id: 'zh-CN-shaanxi-XiaoniNeural', name: 'Xiaoni (晓妮)', language: 'zh-CN-SX', gender: 'female' },

      { id: 'en-US-JennyNeural', name: 'Jenny', language: 'en-US', gender: 'female' },
      { id: 'en-US-GuyNeural', name: 'Guy', language: 'en-US', gender: 'male' },
      { id: 'en-US-AriaNeural', name: 'Aria', language: 'en-US', gender: 'female' },
      { id: 'en-US-DavisNeural', name: 'Davis', language: 'en-US', gender: 'male' },
      { id: 'en-GB-SoniaNeural', name: 'Sonia', language: 'en-GB', gender: 'female' },
      { id: 'en-GB-RyanNeural', name: 'Ryan', language: 'en-GB', gender: 'male' },

      { id: 'ja-JP-NanamiNeural', name: 'Nanami', language: 'ja-JP', gender: 'female' },
      { id: 'ja-JP-KeitaNeural', name: 'Keita', language: 'ja-JP', gender: 'male' },

      { id: 'ko-KR-SunHiNeural', name: 'SunHi', language: 'ko-KR', gender: 'female' },
    ];
  }

  async synthesize(request: TTSRequest): Promise<string> {
    // 确保输出目录存在
    await mkdir(dirname(request.outputPath), { recursive: true });

    // 动态加载以保持可选依赖
    let nodeEdgeTts: any;
    try {
      nodeEdgeTts = (await import('node-edge-tts')).default;
    } catch (e) {
      throw new Error(
        'node-edge-tts is required for Edge TTS. Install with: npm install node-edge-tts'
      );
    }

    const tts = new nodeEdgeTts({
      voice: request.voice,
      lang: request.voice.split('-').slice(0, 2).join('-'),
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      rate: this.toEdgeRate(request.speed || 1.0),
      pitch: this.toEdgePitch(request.pitch || 1.0),
    });

    await tts.ttsPromise(request.text, request.outputPath);
    return request.outputPath;
  }

  /** 转换为 Edge TTS 速率格式（+0%, +10%, -10%） */
  private toEdgeRate(speed: number): string {
    const percent = Math.round((speed - 1) * 100);
    return `${percent >= 0 ? '+' : ''}${percent}%`;
  }

  /** 转换为 Edge TTS 音调格式 */
  private toEdgePitch(pitch: number): string {
    const percent = Math.round((pitch - 1) * 100);
    return `${percent >= 0 ? '+' : ''}${percent}%`;
  }
}
