/**
 * 图片 Provider 配置注册表
 */

import type { ImageProviderConfig } from './types.js';

export const IMAGE_PROVIDERS: { [key: string]: ImageProviderConfig } = {
  picsum: {
    id: 'picsum',
    name: 'Picsum 随机图',
    type: 'random',
    baseURL: 'https://picsum.photos',
    enabled: true,
    requiresKey: false,
    description: 'Lorem Picsum - 基于 seed 的随机图，无需 key',
    emoji: '🎲'
  },
  pollinations: {
    id: 'pollinations',
    name: 'Pollinations AI',
    type: 'generate',
    baseURL: 'https://image.pollinations.ai/prompt',
    enabled: true,
    requiresKey: false,
    description: 'Pollinations.ai - 免费 AI 文生图，URL 直出无需 key',
    emoji: '🎨',
    defaultModel: 'flux'
  },
  unsplash: {
    id: 'unsplash',
    name: 'Unsplash 搜索',
    type: 'search',
    apiKeyEnv: 'UNSPLASH_ACCESS_KEY',
    baseURL: 'https://api.unsplash.com',
    enabled: false,
    requiresKey: true,
    description: 'Unsplash 高质量摄影，100万+ 免费图片',
    emoji: '📷'
  },
  pexels: {
    id: 'pexels',
    name: 'Pexels 搜索',
    type: 'search',
    apiKeyEnv: 'PEXELS_API_KEY',
    baseURL: 'https://api.pexels.com/v1',
    enabled: false,
    requiresKey: true,
    description: 'Pexels 免版税图片 + 视频',
    emoji: '🌄'
  },
  dalle: {
    id: 'dalle',
    name: 'DALL-E 3',
    type: 'generate',
    apiKeyEnv: 'OPENAI_API_KEY',
    enabled: false,
    requiresKey: true,
    description: 'OpenAI DALL-E 3 顶级质量',
    emoji: '🤖',
    defaultModel: 'dall-e-3'
  },
  sd: {
    id: 'sd',
    name: 'Stable Diffusion',
    type: 'generate',
    apiKeyEnv: 'STABILITY_API_KEY',
    baseURL: 'https://api.stability.ai',
    enabled: false,
    requiresKey: true,
    description: 'Stability AI SD 3.5 / SDXL',
    emoji: '🎭',
    defaultModel: 'stable-diffusion-xl-1024-v1-0'
  }
};

export const DEFAULT_IMAGE_PROVIDER = 'picsum';

export function getImageProvider(id?: string): ImageProviderConfig {
  const providerId = id || DEFAULT_IMAGE_PROVIDER;
  return IMAGE_PROVIDERS[providerId] || IMAGE_PROVIDERS[DEFAULT_IMAGE_PROVIDER];
}

export function getEnabledImageProviders(): ImageProviderConfig[] {
  return Object.values(IMAGE_PROVIDERS).filter(p => p.enabled);
}

export function getAllImageProviders(): ImageProviderConfig[] {
  return Object.values(IMAGE_PROVIDERS);
}
