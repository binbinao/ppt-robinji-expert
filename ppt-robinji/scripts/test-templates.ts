#!/usr/bin/env node

/**
 * 模板批量测试 - 用真实 AI 内容生成所有模板的 PPT
 */

import { config } from 'dotenv';
import { existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import AIGenerator from '../src/ai/generator.js';
import PPTCreator from '../src/pptx/creator.js';
import { ALL_TEMPLATES, getTemplate } from '../src/pptx/templates/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, '../output');

config({ path: join(__dirname, '../.env'), quiet: true });

const SAMPLE_TOPIC = process.argv[2] || '人工智能在医疗诊断中的应用';

async function generateWithAI() {
  const hasKey = !!process.env.MINIMAX_API_KEY || !!process.env.DEEPSEEK_API_KEY
    || !!process.env.ANTHROPIC_API_KEY || !!process.env.OPENAI_API_KEY;

  if (!hasKey) {
    console.log('⚠️  未配置 API Key，使用 mock 内容');
    return {
      title: SAMPLE_TOPIC,
      subtitle: 'AI 驱动未来 · 行业洞察与实践',
      slides: [
        { title: '背景与现状', type: 'content', content: [
          'AI 技术在医疗领域取得突破性进展，诊断准确率达 95%+',
          '全球医疗 AI 市场规模 2026 年突破 500 亿美元',
          '中国 80% 顶级医院已部署 AI 辅助诊断系统',
          '基层医院 AI 渗透率从 2020 年 12% 增至 2026 年 65%'
        ]},
        { title: '核心技术架构', type: 'content', content: [
          '多模态医学影像识别：CT/MRI/病理切片统一处理',
          '电子病历 NLP 解析：自动提取关键症状与病史',
          '临床决策支持：实时推荐诊疗方案',
          '药物研发加速：AI 辅助靶点发现与药物设计'
        ]},
        { title: '行业应用案例', type: 'content', content: [
          '肺结节早筛：准确率 97.3%，假阳性率 < 5%',
          '糖尿病视网膜病变筛查：覆盖 5000 万基层患者',
          '病理 AI 辅助：医生效率提升 3-5 倍',
          '新冠 CT 影像分析：30 秒完成全肺扫描'
        ]},
        { title: '挑战与风险', type: 'content', content: [
          '数据隐私：患者信息保护与合规挑战',
          '算法可解释性：医生信任建立',
          '责任界定：AI 误诊的法律责任',
          '技术伦理：避免算法偏见与歧视'
        ]},
        { title: '未来展望', type: 'content', content: [
          '通用医疗大模型：覆盖 90% 常见病种',
          '个性化诊疗：基于基因组的精准医疗',
          '手术机器人 + AI：远程手术成为现实',
          '2030 年医疗 AI 覆盖率将达 95%'
        ]}
      ]
    };
  }

  console.log('⏳ 调用 AI 生成内容...');
  const generator = new AIGenerator();
  const content = await generator.generateOutline({
    topic: SAMPLE_TOPIC,
    slides: 5,
    style: 'professional'
  });
  console.log(`✅ AI 生成完成 (${content.slides.length} 页)`);
  return content;
}

async function testAllTemplates(content: any) {
  console.log('\n🎨 批量生成 13 个模板的 PPT');
  console.log('━'.repeat(80));

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results: Array<{ template: string; path: string; size: number; ok: boolean }> = [];

  for (const t of ALL_TEMPLATES) {
    const outputPath = join(OUTPUT_DIR, `template-${t.id}.pptx`);
    try {
      const creator = new PPTCreator({ template: t.id, author: 'ppt-robinji-template-test' });
      await creator.createFromOutline(content);
      await creator.save(outputPath);
      const stats = statSync(outputPath);
      results.push({ template: t.id, path: outputPath, size: stats.size, ok: true });
      console.log(`  ✅ [${t.emoji}] ${t.id.padEnd(22)} ${(stats.size / 1024).toFixed(1).padStart(6)} KB`);
    } catch (error) {
      console.log(`  ❌ [${t.emoji}] ${t.id.padEnd(22)} 失败: ${error}`);
      results.push({ template: t.id, path: '', size: 0, ok: false });
    }
  }

  return results;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          ppt-robinji 模板批量测试                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n主题: ${SAMPLE_TOPIC}`);

  const content = await generateWithAI();
  const results = await testAllTemplates(content);

  const success = results.filter(r => r.ok).length;
  const totalSize = results.filter(r => r.ok).reduce((s, r) => s + r.size, 0);

  console.log('\n\n📊 测试总结');
  console.log('━'.repeat(80));
  console.log(`✅ 成功: ${success}/${results.length}`);
  console.log(`📦 总大小: ${(totalSize / 1024).toFixed(1)} KB`);
  console.log(`📁 输出目录: ${OUTPUT_DIR}`);
  console.log(`\n生成的文件:`);
  results.filter(r => r.ok).forEach(r => {
    console.log(`   📄 ${r.path.split('/').pop()} (${(r.size / 1024).toFixed(1)} KB)`);
  });
}

main().catch(err => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
