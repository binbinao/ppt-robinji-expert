#!/usr/bin/env node

// P1 Test - Brand elements + Duration estimate
// Test brand customization and speech duration tracking

import { config } from 'dotenv';
import { existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import AIGenerator from '../src/ai/generator.js';
import ImageService from '../src/image/image-service.js';
import PPTCreator from '../src/pptx/creator.js';
import type { PPTContent } from '../src/ai/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, '../output');

config({ path: join(__dirname, '../.env'), quiet: true });

async function run() {
  console.log('=====================================================');
  console.log('  ppt-robinji P1 Test - Brand + Duration');
  console.log('=====================================================');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 场景 1: AI 生成 + 品牌定制 + 时长估算
  console.log('\n[Scenario 1] AI Generation with Brand Customization');
  console.log('-'.repeat(80));

  if (!process.env.MINIMAX_API_KEY && !process.env.DEEPSEEK_API_KEY
    && !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    console.log('[SKIP] No API key, skipping AI test');
  } else {
    console.log('Calling AI to generate TED-style content...');
    const generator = new AIGenerator();
    const content = await generator.generateOutline({
      topic: 'How to Build AI Products Users Love',
      slides: 8,
      structure: 'ted'
    });

    console.log(`[OK] Generated ${content.slides.length} slides`);
    console.log(`[OK] Estimated duration: ${content.estimatedDuration} min`);
    console.log(`[OK] Total script length: ${content.totalScriptLength} chars`);

    // 添加图片
    const imgService = new ImageService('picsum');
    for (const slide of content.slides) {
      if (slide.imageQuery && !slide.imageUrl) {
        const img = await imgService.getOne({
          query: slide.imageQuery,
          width: 800,
          height: 600
        });
        if (img) slide.imageUrl = img.url;
      }
    }

    // 用品牌定制渲染
    const outputPath = join(OUTPUT_DIR, 'p1-branded-ai.pptx');
    const creator = new PPTCreator({
      template: 'tech-neon',
      author: 'Robinji',
      company: 'Robinji AI',
      logo: 'R',
      footerText: 'Robinji AI | robinji.com',
      showFooter: true
    });
    await creator.createFromOutline(content);
    await creator.save(outputPath);

    const stats = statSync(outputPath);
    console.log(`[OK] PPT created: ${outputPath.split('/').pop()} (${(stats.size / 1024).toFixed(1)} KB)`);
    console.log(`[OK] Slide types: ${content.slides.map(s => s.type).join(' | ')}`);
  }

  // 场景 2: Mock 数据 + 多种品牌风格
  console.log('\n\n[Scenario 2] Brand Variations Demo');
  console.log('-'.repeat(80));

  const mockContent: PPTContent = {
    title: 'Annual Strategy Review 2026',
    subtitle: 'Building the Future Together',
    estimatedDuration: 8,
    slides: [
      { title: 'Welcome to Our Annual Strategy Review', type: 'cover', content: ['A look at our 2026 roadmap', 'Q1 2026'] },
      { title: 'Agenda', type: 'agenda', content: ['2025 Recap', '2026 Strategy', 'Resource Allocation', 'Q&A'] },
      { title: '$2.4B Revenue in 2025', type: 'kpi', kpiValue: '$2.4B', kpiUnit: 'revenue', kpiContext: '2025 TOTAL REVENUE' },
      { title: 'Top 3 Wins', type: 'content', content: ['New product line exceeded targets by 40%', 'Customer satisfaction up 25%', 'Expanded to 12 new markets'] },
      { title: 'Three Strategic Pillars for 2026', type: 'process', steps: [
        { title: 'Innovation', description: 'Double R&D investment' },
        { title: 'Customer', description: 'Reach 1M active users' },
        { title: 'Global', description: 'Enter 20 new markets' }
      ] },
      { title: 'Roadmap Timeline', type: 'timeline', events: [
        { date: 'Q1', title: 'Product Launch', description: 'AI Suite v2.0' },
        { date: 'Q2', title: 'Market Expansion', description: 'EU + APAC' },
        { date: 'Q3', title: 'Partnership', description: '5 strategic deals' },
        { date: 'Q4', title: 'IPO Prep', description: 'Final review' }
      ] },
      { title: 'Discussion and Q&A', type: 'qa' },
      { title: 'Thank You', type: 'thank-you', content: ['investor@company.com', 'www.company.com/ir'] }
    ]
  };

  // 不同品牌风格
  const brands = [
    { name: 'TechCo', logo: 'T', color: 'tech-neon' },
    { name: 'BizCorp', logo: 'B', color: 'business-elegant' },
    { name: 'CreativeStudio', logo: 'C', color: 'creative-aurora' }
  ];

  for (const b of brands) {
    const outputPath = join(OUTPUT_DIR, `p1-brand-${b.color}.pptx`);
    const creator = new PPTCreator({
      template: b.color,
      author: 'Strategy Team',
      company: b.name,
      logo: b.logo,
      footerText: `${b.name} | Confidential`,
      showFooter: true
    });
    await creator.createFromOutline(mockContent);
    await creator.save(outputPath);
    const stats = statSync(outputPath);
    console.log(`  [OK] [${b.name.padEnd(18)}] ${outputPath.split('/').pop()} (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  console.log('\n\n[Done] P1 Test Complete!');
  console.log('\nKey features demonstrated:');
  console.log('  - Brand: company name in footer and cover');
  console.log('  - Logo: text logo on cover slide');
  console.log('  - Footer: customizable footer text on every content slide');
  console.log('  - Duration: auto-estimated presentation duration');
  console.log('  - Speaker notes: per-slide duration hints');
}

run().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
