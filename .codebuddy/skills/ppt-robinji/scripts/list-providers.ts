#!/usr/bin/env node

/**
 * 列出所有可用的 AI Provider
 * 用于查看配置状态和切换 provider
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  loadProvidersConfig,
  getAllProviders,
  getDefaultProvider,
  isProviderConfigured
} from '../src/ai/providers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env（如果存在）
const envPath = join(__dirname, '../.env');
config({ path: envPath, quiet: true });

function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           ppt-robinji AI Provider 列表                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const config = loadProvidersConfig();
  const defaultProvider = getDefaultProvider();
  const allProviders = getAllProviders();

  console.log(`\n当前默认 provider: ⭐ ${defaultProvider}\n`);

  if (existsSync(envPath)) {
    console.log(`✅ .env 文件已加载: ${envPath}\n`);
  } else {
    console.log(`⚠️  .env 文件未找到 (使用 PROVIDER 环境变量或创建 .env)\n`);
  }

  console.log('─'.repeat(86));
  console.log(`${'ID'.padEnd(14)} | ${'类型'.padEnd(20)} | ${'默认模型'.padEnd(28)} | Key | 描述`);
  console.log('─'.repeat(86));

  for (const { id, config: p } of allProviders) {
    const isDefault = id === defaultProvider;
    const marker = isDefault ? '⭐' : '  ';
    const typeLabel = p.type === 'openai-compatible'
      ? `OpenAI 兼容`
      : p.type === 'anthropic' ? 'Anthropic SDK' : 'OpenAI SDK';
    const configured = isProviderConfigured(id);
    const keyStatus = configured ? '✅' : '❌';

    console.log(`${marker} ${id.padEnd(11)} | ${typeLabel.padEnd(20)} | ${p.defaultModel.padEnd(28)} | ${keyStatus}  | ${p.description || ''}`);
  }

  console.log('─'.repeat(86));

  console.log('\n💡 使用方式:');
  console.log('   1. 编辑 .env，设置 PROVIDER=<id> 切换');
  console.log('   2. 或设置环境变量 PROVIDER=<id> 临时切换');
  console.log('   3. 命令行: npm run generate -- -p <id> -t "主题"\n');

  console.log('📋 启用的 provider:');
  const enabled = allProviders.filter(p => p.config.enabled);
  enabled.forEach(p => {
    const configured = isProviderConfigured(p.id);
    const status = configured ? '✅ 已配置' : '⚠️  未配置 key';
    console.log(`   - ${p.id}: ${status}`);
  });

  console.log('\n🔧 启用的 provider 中可立即使用的:');
  const ready = allProviders.filter(p => p.config.enabled && isProviderConfigured(p.id));
  if (ready.length === 0) {
    console.log('   (无) - 请在 .env 中配置至少一个 provider 的 API key');
  } else {
    ready.forEach(p => console.log(`   - ${p.id}`));
  }

  console.log('');
}

main();
