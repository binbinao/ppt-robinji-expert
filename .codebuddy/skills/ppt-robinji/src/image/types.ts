/**
 * 图片服务系统 - 类型定义
 *
 * 支持两种图片来源：
 * 1. 互联网搜索：Unsplash、Pexels、Pixabay、Picsum（无需 key）
 * 2. AI 生成：Pollinations（无需 key）、DALL-E、Stable Diffusion、Replicate
 */

export type ImageSource =
  | 'unsplash'        // 互联网搜索
  | 'pexels'          // 互联网搜索
  | 'picsum'          // 随机图（无需 key）
  | 'pollinations'    // AI 生成（无需 key）
  | 'dalle'           // AI 生成
  | 'sd'              // Stable Diffusion
  | 'replicate';      // AI 生成（多模型）

export interface ImageProviderConfig {
  id: ImageSource;
  name: string;
  type: 'search' | 'generate' | 'random';
  apiKeyEnv?: string;          // API key 环境变量名
  baseURL?: string;            // API endpoint
  enabled: boolean;            // 是否启用
  requiresKey: boolean;        // 是否需要 API key
  description: string;         // 描述
  emoji: string;               // 用于展示
  defaultModel?: string;       // AI 模型的默认名称
}

export interface ImageSearchOptions {
  query: string;
  count?: number;              // 数量
  orientation?: 'landscape' | 'portrait' | 'squarish';
  size?: 'small' | 'medium' | 'large';
  // 仅 generate 使用
  width?: number;
  height?: number;
  style?: string;              // AI 风格 (如 'photographic', 'digital-art')
}

export interface ImageResult {
  url: string;                 // 远程 URL（可直接插入 PPT）
  thumbUrl?: string;           // 缩略图
  width: number;
  height: number;
  source: ImageSource;         // 来源
  prompt?: string;             // AI 生成时的 prompt
  query?: string;              // 搜索关键词
  author?: string;             // 摄影师/作者
  downloadUrl?: string;        // 实际下载 URL
  cached?: boolean;            // 是否来自缓存
}
