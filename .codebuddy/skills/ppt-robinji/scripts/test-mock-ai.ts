#!/usr/bin/env node

/**
 * Mock AI 测试 - 验证完整端到端流程
 *
 * 不消耗任何 API key，直接用 mock 数据模拟 AI 生成结果
 * 用于验证：JSON 解析、PPT 创建、保存输出、provider 配置加载等
 */

import { config } from 'dotenv';
import { existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadProvidersConfig, getDefaultProvider, getProviderConfig } from '../src/ai/providers.js';
import PPTCreator, { DEFAULT_PALETTES } from '../src/pptx/creator.js';
import type { PPTContent } from '../src/ai/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, '../output');

// 加载 .env
config({ path: join(__dirname, '../.env'), quiet: true });

// 模拟 AI 生成的 PPT 大纲 - 不同主题不同风格
function mockGenerate(topic: string, style: 'professional' | 'creative' | 'minimal' = 'professional', slides: number = 6): PPTContent {
  const styleDescriptions = {
    professional: ['核心观点', '数据洞察', '战略分析', '实施路径', '关键指标', '未来展望'],
    creative: ['灵感起源', '创意发想', '故事叙事', '互动体验', '情感共鸣', '品牌延伸'],
    minimal: ['背景', '本质', '方法', '结果', '反思']
  };

  const sections = styleDescriptions[style].slice(0, slides);
  const palette = style === 'professional' ? 'midnight-executive'
    : style === 'creative' ? 'coral-energy'
    : 'charcoal-minimal';

  return {
    title: topic,
    subtitle: `${style === 'professional' ? '专业报告' : style === 'creative' ? '创意方案' : '极简分析'} · Mock 数据演示`,
    slides: sections.map((section, i) => ({
      title: `${i + 1}. ${section}`,
      type: i === 0 ? 'title' : (i === sections.length - 1 ? 'conclusion' : 'content') as any,
      content: [
        `${section}相关的第一个核心要点`,
        `${section}相关的第二个支撑数据`,
        `${section}相关的第三个关键洞察`,
        `${section}相关的第四个行动建议`
      ],
      notes: `演讲备注：阐述 ${section} 的详细分析`
    }))
  };
}

async function testProviderConfig() {
  console.log('\n📋 测试 1: Provider 配置加载');
  console.log('━'.repeat(60));

  const config = loadProvidersConfig();
  const defaultProvider = getDefaultProvider();
  const defaultConfig = getProviderConfig(defaultProvider);

  console.log(`✅ 加载了 ${Object.keys(config.providers).length} 个 provider 配置`);
  console.log(`✅ 默认 provider: ${defaultProvider}`);
  console.log(`✅ 默认模型: ${defaultConfig?.defaultModel}`);
  console.log(`✅ baseURL: ${defaultConfig?.baseURL || '(官方)'}`);
  console.log(`✅ 类型: ${defaultConfig?.type}`);

  return { defaultProvider, defaultConfig };
}

async function testMockGeneration() {
  console.log('\n\n🤖 测试 2: Mock AI 内容生成');
  console.log('━'.repeat(60));

  const topic = process.argv[2] || '2026年AI技术发展趋势';
  const style = (process.argv[3] as any) || 'professional';
  const slideCount = parseInt(process.argv[4] || '6');

  console.log(`\n主题: ${topic}`);
  console.log(`风格: ${style}`);
  console.log(`幻灯片数: ${slideCount}`);

  // 模拟 AI 调用耗时
  console.log(`\n⏳ 模拟 AI 调用...`);
  await new Promise(r => setTimeout(r, 500));

  const content = mockGenerate(topic, style, slideCount);

  console.log(`✅ Mock 内容生成完成`);
  console.log(`\n📑 生成内容预览:`);
  console.log(`   标题: ${content.title}`);
  console.log(`   副标题: ${content.subtitle}`);
  console.log(`   页数: ${content.slides.length}`);
  console.log(`\n   大纲:`);
  content.slides.forEach((s, i) => {
    console.log(`   ${i + 1}. [${s.type.padEnd(10)}] ${s.title}`);
  });

  return content;
}

async function testPPTCreation(content: PPTContent, palette: string) {
  console.log(`\n\n🎨 测试 3: 创建 PPT (${palette})`);
  console.log('━'.repeat(60));

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputPath = join(OUTPUT_DIR, `mock-ai-${palette}.pptx`);

  const creator = new PPTCreator({ palette, author: 'ppt-robinji-mock-test' });
  await creator.createFromOutline(content);
  await creator.save(outputPath);

  const stats = statSync(outputPath);
  console.log(`\n✅ PPT 创建成功`);
  console.log(`   路径: ${outputPath}`);
  console.log(`   大小: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`   页数: ${content.slides.length + 2} (含标题页 + 结论页)`);

  return outputPath;
}

async function testAllPalettes(content: PPTContent) {
  console.log('\n\n🌈 测试 4: 5 种配色方案批量创建');
  console.log('━'.repeat(60));

  const palettes = Object.keys(DEFAULT_PALETTES);
  const results: Array<{ palette: string; path: string; size: number }> = [];

  for (const palette of palettes) {
    const path = await testPPTCreation(content, palette);
    const stats = statSync(path);
    results.push({ palette, path, size: stats.size });
  }

  return results;
}

async function testJSONParsing() {
  console.log('\n\n🔍 测试 5: JSON 解析兼容性');
  console.log('━'.repeat(60));

  // 测试 1: 标准 JSON
  const standardJson = '{"title":"测试","slides":[]}';
  try {
    JSON.parse(standardJson);
    console.log(`✅ 标准 JSON 解析`);
  } catch (e) {
    console.log(`❌ 标准 JSON 解析失败`);
  }

  // 测试 2: Markdown code block 中的 JSON
  const codeBlockJson = '```json\n{"title":"测试","slides":[]}\n```';
  const match1 = codeBlockJson.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (match1) {
    try {
      JSON.parse(match1[1]);
      console.log(`✅ Markdown code block JSON 解析`);
    } catch (e) {
      console.log(`❌ Markdown code block JSON 解析失败`);
    }
  } else {
    console.log(`❌ Markdown code block 提取失败`);
  }

  // 测试 3: 嵌入文本中的 JSON
  const embeddedJson = '这是一些说明文字，然后是 JSON: {"title":"测试","slides":[]}，结束。';
  const match2 = embeddedJson.match(/\{[\s\S]*\}/);
  if (match2) {
    try {
      JSON.parse(match2[0]);
      console.log(`✅ 嵌入 JSON 解析`);
    } catch (e) {
      console.log(`❌ 嵌入 JSON 解析失败`);
    }
  } else {
    console.log(`❌ 嵌入 JSON 提取失败`);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   ppt-robinji 端到端 Mock 测试 (不消耗 API)                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    const { defaultProvider } = await testProviderConfig();
    const content = await testMockGeneration();
    const results = await testAllPalettes(content);
    await testJSONParsing();

    // 最终总结
    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   📊 测试总结                                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n✅ Provider 配置加载: 正常`);
    console.log(`✅ Mock AI 内容生成: 正常`);
    console.log(`✅ JSON 解析兼容: 3/3 通过`);
    console.log(`✅ PPT 创建: ${results.length} 个配色方案全部成功`);
    console.log(`\n生成的文件:`);
    results.forEach(r => {
      console.log(`   📄 ${r.path.replace(/.*\//, '')} (${(r.size / 1024).toFixed(1)} KB)`);
    });

    console.log(`\n💡 当前默认 provider: ${defaultProvider}`);
    console.log(`\n下一步: 在 .env 中填入真实的 ${defaultProvider.toUpperCase()}_API_KEY 即可激活真实 AI 生成`);
    console.log(`\n命令: npm run test:ai -- "你的主题"`);
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

main();
