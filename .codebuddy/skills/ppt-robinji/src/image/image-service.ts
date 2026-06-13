/**
 * 图片服务统一接口和实现
 *
 * 支持多种图片来源：
 * - 互联网搜索: Unsplash、Pexels
 * - AI 生成: Pollinations（免费）、DALL-E、Stable Diffusion
 * - 随机图: Picsum（无需 key）
 */

import type { ImageResult, ImageSearchOptions, ImageSource } from './types.js';
import { getImageProvider, IMAGE_PROVIDERS } from './providers-config.js';

// 简单的内存缓存
const imageCache: { [key: string]: Promise<ImageResult[]> } = {};

export class ImageService {
  private provider: string;

  constructor(provider?: string) {
    this.provider = provider || 'picsum';
  }

  /**
   * 搜索/生成图片（统一入口）
   */
  async search(options: ImageSearchOptions): Promise<ImageResult[]> {
    const cacheKey = `${this.provider}:${JSON.stringify(options)}`;
    const cached = imageCache[cacheKey];
    if (cached !== undefined) {
      const result = await cached;
      return result.map(r => ({ ...r, cached: true }));
    }

    let result: Promise<ImageResult[]>;
    switch (this.provider) {
      case 'picsum':
        result = this.searchPicsum(options);
        break;
      case 'pollinations':
        result = this.generatePollinations(options);
        break;
      case 'unsplash':
        result = this.searchUnsplash(options);
        break;
      case 'pexels':
        result = this.searchPexels(options);
        break;
      case 'dalle':
        result = this.generateDalle(options);
        break;
      case 'sd':
        result = this.generateStability(options);
        break;
      default:
        result = this.searchPicsum(options);
    }

    imageCache[cacheKey] = result;
    return result;
  }

  /**
   * 获取单张图片（用于单图场景）
   */
  async getOne(options: ImageSearchOptions): Promise<ImageResult | null> {
    const results = await this.search(options);
    return results[0] || null;
  }

  /**
   * Picsum - 基于 seed 的随机图，无需 key
   * https://picsum.photos/seed/{seed}/{width}/{height}
   */
  private async searchPicsum(options: ImageSearchOptions): Promise<ImageResult[]> {
    const count = options.count || 1;
    const width = options.width || 800;
    const height = options.height || 600;
    const orientation = options.orientation || 'landscape';

    // 根据 orientation 调整宽高
    let w = width, h = height;
    if (orientation === 'landscape') { w = 800; h = 600; }
    else if (orientation === 'portrait') { w = 600; h = 800; }
    else if (orientation === 'squarish') { w = 600; h = 600; }

    const results: ImageResult[] = [];
    for (let i = 0; i < count; i++) {
      // 用 query + index 作为 seed，确保相同 query 返回相同图
      const seed = encodeURIComponent(`${options.query}-${i}`);
      results.push({
        url: `https://picsum.photos/seed/${seed}/${w}/${h}`,
        width: w,
        height: h,
        source: 'picsum',
        query: options.query
      });
    }
    return results;
  }

  /**
   * Pollinations - 免费 AI 文生图，URL 直出
   * https://image.pollinations.ai/prompt/{prompt}?width=...&height=...&seed=...
   */
  private async generatePollinations(options: ImageSearchOptions): Promise<ImageResult[]> {
    const count = options.count || 1;
    const width = options.width || 1024;
    const height = options.height || 768;
    const style = options.style || 'photographic';

    // 增强 prompt：加入风格提示
    const prompt = encodeURIComponent(`${options.query}, ${style} style, high quality, detailed`);

    const results: ImageResult[] = [];
    for (let i = 0; i < count; i++) {
      const seed = Math.floor(Math.random() * 1000000) + i;
      const url = `https://image.pollinations.ai/prompt/${prompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
      results.push({
        url,
        width,
        height,
        source: 'pollinations',
        prompt: options.query,
        query: options.query
      });
    }
    return results;
  }

  /**
   * Unsplash - 需 API key
   * GET https://api.unsplash.com/search/photos?query=...&per_page=...
   */
  private async searchUnsplash(options: ImageSearchOptions): Promise<ImageResult[]> {
    const apiKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!apiKey) {
      console.warn('⚠️  Unsplash 需要 API Key，回退到 Picsum');
      return this.searchPicsum(options);
    }

    const count = options.count || 1;
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', options.query);
    url.searchParams.set('per_page', String(count));
    if (options.orientation) url.searchParams.set('orientation', options.orientation);

    try {
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Client-ID ${apiKey}` }
      });
      if (!response.ok) throw new Error(`Unsplash API error: ${response.status}`);

      const data = await response.json() as any;
      return (data.results || []).map((photo: any) => ({
        url: photo.urls.regular,
        thumbUrl: photo.urls.thumb,
        width: photo.width,
        height: photo.height,
        source: 'unsplash',
        query: options.query,
        author: photo.user?.name,
        downloadUrl: photo.urls.full
      }));
    } catch (error) {
      console.warn('Unsplash 搜索失败，回退到 Picsum:', (error as Error).message);
      return this.searchPicsum(options);
    }
  }

  /**
   * Pexels - 需 API key
   */
  private async searchPexels(options: ImageSearchOptions): Promise<ImageResult[]> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  Pexels 需要 API Key，回退到 Picsum');
      return this.searchPicsum(options);
    }

    const count = options.count || 1;
    const url = new URL('https://api.pexels.com/v1/search');
    url.searchParams.set('query', options.query);
    url.searchParams.set('per_page', String(count));
    if (options.orientation) {
      const map: any = { landscape: 'landscape', portrait: 'portrait', squarish: 'square' };
      url.searchParams.set('orientation', map[options.orientation] || 'landscape');
    }

    try {
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': apiKey }
      });
      if (!response.ok) throw new Error(`Pexels API error: ${response.status}`);

      const data = await response.json() as any;
      return (data.photos || []).map((photo: any) => ({
        url: photo.src.large,
        thumbUrl: photo.src.tiny,
        width: photo.width,
        height: photo.height,
        source: 'pexels',
        query: options.query,
        author: photo.photographer,
        downloadUrl: photo.src.original
      }));
    } catch (error) {
      console.warn('Pexels 搜索失败，回退到 Picsum:', (error as Error).message);
      return this.searchPicsum(options);
    }
  }

  /**
   * DALL-E 3 - 需 OpenAI API key
   * 生成的图片 URL 有效期 1 小时，建议下载保存
   */
  private async generateDalle(options: ImageSearchOptions): Promise<ImageResult[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  DALL-E 需要 OPENAI_API_KEY，回退到 Pollinations');
      return this.generatePollinations(options);
    }

    const width = options.width || 1024;
    const height = options.height || 1024;
    // DALL-E 3 支持 1024x1024, 1792x1024, 1024x1792
    const size = width > height ? '1792x1024' : height > width ? '1024x1792' : '1024x1024';

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: options.query,
          n: 1,
          size,
          quality: 'standard'
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`DALL-E API error: ${response.status} ${err}`);
      }

      const data = await response.json() as any;
      const imageData = data.data?.[0];
      if (!imageData) throw new Error('No image data in response');

      const [w, h] = size.split('x').map(Number);
      return [{
        url: imageData.url,
        width: w,
        height: h,
        source: 'dalle',
        prompt: imageData.revised_prompt || options.query,
        query: options.query
      }];
    } catch (error) {
      console.warn('DALL-E 生成失败，回退到 Pollinations:', (error as Error).message);
      return this.generatePollinations(options);
    }
  }

  /**
   * Stability AI - Stable Diffusion
   */
  private async generateStability(options: ImageSearchOptions): Promise<ImageResult[]> {
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  Stability 需要 API Key，回退到 Pollinations');
      return this.generatePollinations(options);
    }

    const width = options.width || 1024;
    const height = options.height || 1024;

    try {
      const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'image/*'
        },
        body: new URLSearchParams({
          prompt: options.query,
          width: String(width),
          height: String(height),
          output_format: 'png'
        })
      });

      if (!response.ok) {
        throw new Error(`Stability API error: ${response.status}`);
      }

      // 返回的是二进制图片
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return [{
        url: `data:image/png;base64,${base64}`,
        width,
        height,
        source: 'sd',
        prompt: options.query,
        query: options.query
      }];
    } catch (error) {
      console.warn('Stability 生成失败，回退到 Pollinations:', (error as Error).message);
      return this.generatePollinations(options);
    }
  }

  /**
   * 切换 provider
   */
  setProvider(provider: string): void {
    if (IMAGE_PROVIDERS[provider]) {
      this.provider = provider;
    } else {
      throw new Error(`Unknown image provider: ${provider}`);
    }
  }

  getProviderName(): string {
    return IMAGE_PROVIDERS[this.provider]?.name || this.provider;
  }
}

export default ImageService;
