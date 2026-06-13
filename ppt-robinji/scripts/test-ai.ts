#!/usr/bin/env node

/**
 * AI 生成测试脚本
 * 验证 AI 提供商连接和 PPT 大纲生成
 *
 * 用法:
 *   1. 在项目根目录创建 .env 文件并填入 DEEPSEEK_API_KEY
 *   2. npm run test:ai
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getProviderConfig, getAPIKey, getDefaultProvider, loadProvidersConfig } from '../src/ai/providers.js';
import AIGenerator from '../src/ai/generator.js';
import PPTCreator from '../src/pptx/creator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENV_PATH = join(__dirname, '../.env');

// 加载 .env
config({ path: ENV_PATH });

async function checkConfig() {
  console.log('\n📋 配置检查');
  console.log('━'.repeat(50));

  if (!existsSync(ENV_PATH)) {
    console.log(`❌ .env 文件不存在: ${ENV_PATH}`);
    console.log(`\n请创建 .env 文件，内容示例：`);
    console.log(`   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx`);
    console.log(`   PROVIDER=deepseek\n`);
    return false;
  } else {
    console.log(`✅ .env 文件存在`);
  }

  const providers = loadProvidersConfig();
  console.log(`\n可用提供商:`);
  for (const [name, p] of Object.entries(providers.providers)) {
    if (!p.enabled) continue;
    const hasKey = !!getAPIKey(name);
    const marker = name === providers.defaultProvider ? '⭐' : '  ';
    console.log(`  ${marker} ${name.padEnd(10)} - ${p.name.padEnd(20)} ${hasKey ? '✅' : '❌ (no API key)'}`);
  }

  const defaultProvider = getDefaultProvider();
  const apiKey = getAPIKey(defaultProvider);
  if (!apiKey) {
    console.log(`\n❌ 默认提供商 ${defaultProvider} 未配置 API Key`);
    return false;
  }

  return true;
}

async function testAIGeneration(topic: string) {
  console.log('\n\n🤖 AI 内容生成测试');
  console.log('━'.repeat(50));

  console.log(`\n主题: ${topic}`);
  console.log(`提供商: ${getDefaultProvider()}`);
  console.log(`模型: ${getProviderConfig(getDefaultProvider())?.defaultModel}`);

  const generator = new AIGenerator();

  console.log(`\n⏳ 正在调用 AI 生成大纲...`);
  const startTime = Date.now();

  try {
    const content = await generator.generateOutline({
      topic,
      slides: 6,
      style: 'professional'
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ 生成成功 (${elapsed}s)`);
    console.log(`\n📑 生成结果预览:`);
    console.log(`   标题: ${content.title}`);
    console.log(`   副标题: ${content.subtitle || '(无)'}`);
    console.log(`   幻灯片数: ${content.slides.length}`);
    console.log(`\n   内容大纲:`);
    content.slides.forEach((slide, i) => {
      console.log(`   ${i + 1}. [${slide.type}] ${slide.title}`);
      slide.content.forEach(c => console.log(`      • ${c}`));
    });

    // 保存生成的 PPT
    const outputPath = join(__dirname, '../output/ai-generated.pptx');
    console.log(`\n⏳ 正在创建 PPT 文件...`);
    const creator = new PPTCreator({ palette: 'midnight-executive' });
    await creator.createFromOutline(content);
    await creator.save(outputPath);
    console.log(`✅ PPT 已保存: ${outputPath}`);

    return content;
  } catch (error: any) {
    console.error(`\n❌ AI 生成失败:`, error.message || error);
    if (error.status === 401) {
      console.log(`\n💡 提示: API Key 无效或已过期，请检查 .env 中的配置`);
    } else if (error.status === 429) {
      console.log(`\n💡 提示: API 调用频率超限，请稍后重试`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log(`\n💡 提示: 无法连接到 AI 服务，请检查网络`);
    }
    throw error;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   ppt-robinji AI 生成测试                   ║');
  console.log('╚════════════════════════════════════════════╝');

  const configOk = await checkConfig();
  if (!configOk) {
    process.exit(1);
  }

  // 默认测试主题
  const topic = process.argv[2] || '2026年AI技术发展趋势分析';

  try {
    await testAIGeneration(topic);
    console.log('\n\n✨ AI 测试完成！');
  } catch (error) {
    console.error('\n❌ 测试失败');
    process.exit(1);
  }
}

main();
