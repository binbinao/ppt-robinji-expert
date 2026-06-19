#!/usr/bin/env node
/**
 * Bilingual E2E 测试
 * 不依赖 AI key，使用 mock 内容验证双语 PPT 生成
 */

import { mkdir, rm, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildBilingual, buildTwoPageLayout, buildTwoColumnLayout } from '../src/i18n/index.js';
import { PPTCreator } from '../src/pptx/creator.js';
import { getTemplate } from '../src/pptx/templates/index.js';
import type { BilingualContent } from '../src/i18n/index.js';
import type { SlideContent } from '../src/ai/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DIR = join(__dirname, '../.test-tmp/bilingual-e2e');

async function setup() {
  await mkdir(TEST_DIR, { recursive: true });
}

async function cleanup() {
  try { await rm(TEST_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
}

async function main() {
  await setup();
  try {
    // 构造 mock 双语内容
    const content: BilingualContent = {
      primaryTitle: 'AI 在教育中的应用',
      secondaryTitle: 'AI in Education',
      layout: 'two-page',
      slides: [
        {
          primary: {
            title: '欢迎',
            type: 'cover',
            content: ['中文副标题', '作者'],
            notes: '中文开场白',
          } as SlideContent,
          secondary: {
            title: 'Welcome',
            type: 'cover',
            content: ['English subtitle', 'Author'],
            notes: 'English opening',
          } as SlideContent,
        },
        {
          primary: {
            title: '议程',
            type: 'agenda',
            content: ['背景', '解决方案', '成果'],
            notes: '议程介绍',
          } as SlideContent,
          secondary: {
            title: 'Agenda',
            type: 'agenda',
            content: ['Background', 'Solution', 'Results'],
            notes: 'Agenda intro',
          } as SlideContent,
        },
        {
          primary: {
            title: '关键数据',
            type: 'kpi',
            kpiValue: '60%',
            kpiContext: '学生成绩提升',
            content: [],
            notes: '关键 KPI 讲解',
          } as SlideContent,
          secondary: {
            title: 'Key Metric',
            type: 'kpi',
            kpiValue: '60%',
            kpiContext: 'STUDENT OUTCOMES',
            content: [],
            notes: 'KPI explanation',
          } as SlideContent,
        },
        {
          primary: {
            title: '总结',
            type: 'thank-you',
            content: ['联系方式'],
            notes: '谢谢',
          } as SlideContent,
          secondary: {
            title: 'Thank You',
            type: 'thank-you',
            content: ['Contact us'],
            notes: 'Thanks',
          } as SlideContent,
        },
      ],
    };

    console.log('=== Bilingual E2E Test ===\n');

    // Test 1: two-page layout
    console.log('1. Two-Page Layout');
    const twoPageContent = buildTwoPageLayout(content);
    const creator1 = new PPTCreator({ template: 'business-classic' });
    await creator1.createFromOutline(twoPageContent);
    const output1 = join(TEST_DIR, 'two-page.pptx');
    await creator1.save(output1);
    console.log(`   Generated ${twoPageContent.slides.length} slides`);

    // Test 2: two-column layout
    console.log('2. Two-Column Layout');
    const twoColContent = buildTwoColumnLayout(content);
    const creator2 = new PPTCreator({ template: 'tech-neon' });
    await creator2.createFromOutline(twoColContent);
    const output2 = join(TEST_DIR, 'two-column.pptx');
    await creator2.save(output2);
    console.log(`   Generated ${twoColContent.slides.length} slides`);

    // 验证文件
    const buf1 = await readFile(output1);
    const buf2 = await readFile(output2);
    console.log(`\n3. Output files:`);
    console.log(`   - two-page.pptx: ${buf1.length} bytes`);
    console.log(`   - two-column.pptx: ${buf2.length} bytes`);

    // 验证内容
    const JSZip = (await import('jszip')).default;
    const zip1 = await JSZip.loadAsync(buf1);

    let chineseFound = 0, englishFound = 0;
    const slideFiles = Object.keys(zip1.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f));
    for (const f of slideFiles) {
      const xml = await zip1.file(f)?.async('string');
      if (xml?.includes('欢迎') || xml?.includes('AI 在教育') || xml?.includes('背景')) chineseFound++;
      if (xml?.includes('Welcome') || xml?.includes('Agenda') || xml?.includes('Background')) englishFound++;
    }

    console.log(`\n4. Content verification (two-page):`);
    console.log(`   - Chinese slides: ${chineseFound}`);
    console.log(`   - English slides: ${englishFound}`);

    if (chineseFound > 0 && englishFound > 0 && buf1.length > 5000) {
      console.log('\n✅ Bilingual E2E test PASSED');
    } else {
      console.log('\n❌ Bilingual E2E test FAILED');
      process.exit(1);
    }
  } finally {
    await cleanup();
  }
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
