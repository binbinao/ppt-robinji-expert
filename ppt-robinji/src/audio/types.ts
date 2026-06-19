/**
 * TTS 音频类型定义
 *
 * 为 ppt-robinji 提供统一的 TTS 接口，支持多种 TTS 后端。
 */

/** 音频格式 */
export type AudioFormat = 'mp3' | 'wav';

/** TTS 语音参数 */
export interface TTSVoice {
  /** 语音 ID（如 'zh-CN-XiaoxiaoNeural' 或 'alloy'） */
  id: string;
  /** 显示名称 */
  name: string;
  /** 语言代码（BCP-47，如 'zh-CN'） */
  language: string;
  /** 性别 */
  gender?: 'male' | 'female' | 'neutral';
}

/** TTS 请求 */
export interface TTSRequest {
  /** 要合成的文本 */
  text: string;
  /** 语音 ID */
  voice: string;
  /** 语速倍率（0.5-2.0），默认 1.0 */
  speed?: number;
  /** 音调倍率（0.5-2.0），默认 1.0 */
  pitch?: number;
  /** 输出格式 */
  format?: AudioFormat;
  /** 输出文件路径 */
  outputPath: string;
}

/** TTS 提供器接口 */
export interface TTSProvider {
  /** 提供器名称 */
  name: 'edge' | 'openai' | 'offline' | 'mock';
  /** 是否可用（API key/环境） */
  isAvailable(): Promise<boolean>;
  /** 列出可用语音 */
  listVoices(): Promise<TTSVoice[]>;
  /** 合成语音 */
  synthesize(request: TTSRequest): Promise<string>;
}

/** PPT 中嵌入的音频信息 */
export interface EmbeddedAudio {
  /** 音频文件路径（MP3/WAV） */
  filePath: string;
  /** 显示名称 */
  name: string;
  /** 触发方式：auto = 切到该 slide 时自动播放 */
  trigger: 'auto' | 'click';
  /** 持续时间（秒，可选） */
  duration?: number;
}

/** 扩展 SpeakerNotes 类型 */
export interface SpeakerNotesWithAudio {
  script: string;
  duration?: number;
  keyPoints?: string[];
  audio?: {
    provider: 'edge' | 'openai' | 'offline';
    voice?: string;
    speed?: number;
    /** 生成后填充 */
    generatedPath?: string;
    duration?: number;
  };
}
