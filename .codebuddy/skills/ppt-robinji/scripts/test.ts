#!/usr/bin/env node

/**
 * 本地测试脚本 - 验证 PPT 创建和转换功能
 * 不需要 AI API Key，直接使用 mock 数据
 */

import { existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import PPTCreator, { DEFAULT_PALETTES } from '../src/pptx/creator.js';
import Converter from '../src/converter/index.js';
import type { PPTContent } from '../src/ai/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, '../output');

// 模拟 AI 生成的内容
const mockContent: PPTContent = {
  title: '人工智能在教育中的应用',
  subtitle: 'AI 赋能未来学习',
  slides: [
    {
      title: '引言：AI 教育的崛起',
      type: 'content',
      content: [
        '全球教育科技市场规模突破 3500 亿美元',
        'AI 个性化学习成为主流趋势',
        '教育部明确支持 AI 教育创新',
        '本报告探讨 AI 在教育中的核心应用场景'
      ],
      notes: '可以通过一些数据来引入话题'
    },
    {
      title: '核心应用：智能辅导系统',
      type: 'content',
      content: [
        '24/7 在线答疑，覆盖 K12 至高等教育',
        '自适应学习路径，根据学生能力动态调整',
        '多模态交互：文字、语音、图像全方位支持',
        '典型案例：松鼠 Ai、科大讯飞智学网'
      ]
    },
    {
      title: '核心应用：自动化评估',
      type: 'content',
      content: [
        'AI 批改主观题，准确率达 90%+',
        '作文评分、口语测评、数学解题全场景',
        '即时反馈，提升学习效率 3-5 倍',
        '减轻教师 70% 重复性工作'
      ]
    },
    {
      title: '核心应用：教学资源生成',
      type: 'content',
      content: [
        'AI 一键生成教学 PPT、练习题',
        '多语言支持，打破地域限制',
        '个性化定制，按学情生成差异化内容',
        '教师备课时间缩短 60%'
      ]
    },
    {
      title: '挑战与思考',
      type: 'content',
      content: [
        '数据隐私与安全：学生信息保护',
        '教育公平：避免技术鸿沟加剧',
        '教师角色转变：从知识传授到能力培养',
        '技术与人文的平衡'
      ]
    },
    {
      title: '未来展望',
      type: 'content',
      content: [
        'AI 导师：人人拥有专属学习伙伴',
        '元宇宙 + AI：沉浸式学习体验',
        '终身学习体系：AI 陪伴全人生',
        '2030 年 AI 教育覆盖率将达 80%'
      ],
      notes: '展望未来，给观众信心'
    }
  ]
};

async function testPPTCreation() {
  console.log('\n📝 测试 1: 创建 PPT 文件');
  console.log('━'.repeat(50));

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 测试所有配色方案
  const palettes = Object.keys(DEFAULT_PALETTES);
  console.log(`\n可用配色方案: ${palettes.join(', ')}\n`);

  for (const palette of palettes) {
    const outputPath = join(OUTPUT_DIR, `test-${palette}.pptx`);
    try {
      const creator = new PPTCreator({ palette, author: 'ppt-robinji-test' });
      await creator.createFromOutline({ ...mockContent, title: `${mockContent.title} [${palette}]` });
      await creator.save(outputPath);

      const stats = statSync(outputPath);
      console.log(`✅ [${palette}] PPT 创建成功: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.error(`❌ [${palette}] 失败:`, error);
    }
  }
}

async function testConverter() {
  console.log('\n\n🔄 测试 2: 格式转换');
  console.log('━'.repeat(50));

  const converter = new Converter();
  const deps = await converter.checkDependencies();
  console.log(`\n依赖检查:`);
  console.log(`  - LibreOffice (soffice): ${deps.libreoffice ? '✅' : '❌'}`);
  console.log(`  - pdftoppm: ${deps.pdftoppm ? '✅' : '❌'}`);

  if (!deps.libreoffice) {
    console.log('\n⚠️  跳过 PDF/图片转换测试（未安装 LibreOffice）');
    console.log('   macOS 安装: brew install --cask libreoffice');
    console.log('   Ubuntu 安装: apt install libreoffice poppler-utils');
    return;
  }

  // 使用第一个配色方案的 PPT 测试转换
  const testFile = join(OUTPUT_DIR, `test-midnight-executive.pptx`);
  if (!existsSync(testFile)) {
    console.log('⚠️  测试 PPT 不存在，跳过转换测试');
    return;
  }

  try {
    const pdfPath = join(OUTPUT_DIR, 'test-output.pdf');
    console.log(`\n🔄 转换 PPT → PDF: ${testFile}`);
    await converter.toPDF(testFile, pdfPath);
    const pdfStats = statSync(pdfPath);
    console.log(`✅ PDF 生成成功: ${pdfPath} (${(pdfStats.size / 1024).toFixed(1)} KB)`);
  } catch (error) {
    console.error(`❌ PDF 转换失败:`, error);
  }

  if (deps.pdftoppm) {
    try {
      const imgDir = join(OUTPUT_DIR, 'images');
      console.log(`\n🖼️  转换 PPT → 图片: ${imgDir}`);
      const images = await converter.toImages(testFile, imgDir);
      console.log(`✅ 图片生成成功: ${images.length} 张`);
      images.forEach((img, i) => {
        const stats = statSync(img);
        console.log(`   - ${img} (${(stats.size / 1024).toFixed(1)} KB)`);
      });
    } catch (error) {
      console.error(`❌ 图片转换失败:`, error);
    }
  }
}

async function testColorPalettes() {
  console.log('\n\n🎨 测试 3: 配色方案展示');
  console.log('━'.repeat(50));

  for (const [name, palette] of Object.entries(DEFAULT_PALETTES)) {
    console.log(`\n  [${name}]`);
    console.log(`    主色:    #${palette.primary}`);
    console.log(`    辅色:    #${palette.secondary}`);
    console.log(`    强调色:  #${palette.accent}`);
    console.log(`    文字色:  #${palette.text}`);
    console.log(`    背景色:  #${palette.background}`);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   ppt-robinji 本地功能测试                  ║');
  console.log('╚════════════════════════════════════════════╝');

  try {
    await testColorPalettes();
    await testPPTCreation();
    await testConverter();

    console.log('\n\n✨ 所有测试完成！');
    console.log(`\n输出文件: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

main();
