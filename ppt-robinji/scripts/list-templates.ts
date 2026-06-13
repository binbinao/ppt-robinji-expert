#!/usr/bin/env node

/**
 * 列出所有可用的 PPT 模板
 */

import { ALL_TEMPLATES, getCategories } from '../src/pptx/templates/index.js';

function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          ppt-robinji 模板库 (13 个专业模板)                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const categories = getCategories();

  for (const category of categories) {
    const templates = ALL_TEMPLATES.filter(t => t.category === category);
    const categoryEmojis: { [key: string]: string } = {
      business: '💼',
      tech: '🚀',
      academic: '🎓',
      creative: '🎨',
      education: '📚',
      medical: '🏥',
      finance: '💰',
      minimal: '⬜',
      dark: '🌙',
      gradient: '🌊'
    };
    const categoryNames: { [key: string]: string } = {
      business: '商务风',
      tech: '科技风',
      academic: '学术风',
      creative: '创意风',
      education: '教学风',
      medical: '医疗风',
      finance: '金融风',
      minimal: '极简风',
      dark: '暗黑风',
      gradient: '渐变风'
    };

    console.log(`\n${categoryEmojis[category] || '📁'} ${categoryNames[category] || category} (${templates.length})`);
    console.log('─'.repeat(80));

    for (const t of templates) {
      console.log(`  ${t.emoji} ${t.id.padEnd(25)} - ${t.name}`);
      console.log(`     ${t.description}`);
      console.log(`     主色: #${t.palette.primary} | 字体: ${t.fonts.title} | 风格: ${t.decoration.titleStyle}/${t.decoration.contentStyle}`);
    }
  }

  console.log('\n\n💡 使用方式:');
  console.log('   npm run generate -- -t "主题" --template tech-neon');
  console.log('   npm run test -- --template creative-aurora');
  console.log('   或在 .env 设置默认: TEMPLATE=gradient-ocean');
  console.log('');
}

main();
