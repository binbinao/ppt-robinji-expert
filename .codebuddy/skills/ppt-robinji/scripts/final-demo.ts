#!/usr/bin/env node

// FINAL DEMO - All features showcase
// Demonstrates: AI + Brand + 14 slide types + Images + Density + A11y + Duration

import { config } from 'dotenv';
import { existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import AIGenerator from '../src/ai/generator.js';
import ImageService from '../src/image/image-service.js';
import PPTCreator from '../src/pptx/creator.js';
import { checkA11y } from '../src/pptx/a11y-checker.js';
import { getTemplate } from '../src/pptx/templates/index.js';
import type { PPTContent } from '../src/ai/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, '../output');

config({ path: join(__dirname, '../.env'), quiet: true });

async function run() {
  console.log('====================================================');
  console.log('  ppt-robinji FINAL DEMO');
  console.log('  All Features Integration Test');
  console.log('====================================================');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let content: PPTContent;

  if (process.env.MINIMAX_API_KEY || process.env.DEEPSEEK_API_KEY
    || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) {
    console.log('\n[Step 1] AI Content Generation (TED structure)...');
    const generator = new AIGenerator();
    content = await generator.generateOutline({
      topic: 'How AI is Reshaping the Future of Work in 2026',
      slides: 12,
      style: 'persuasive',
      structure: 'ted'
    });
    console.log(`  [OK] Generated ${content.slides.length} slides`);
    console.log(`  [OK] Estimated duration: ${content.estimatedDuration} min`);
    console.log(`  [OK] Types used: ${[...new Set(content.slides.map(s => s.type))].join(', ')}`);

    console.log('\n[Step 2] Image Service (Pollinations AI)...');
    const imgService = new ImageService('pollinations');
    let imgCount = 0;
    for (const slide of content.slides) {
      if (slide.imageQuery && !slide.imageUrl) {
        const img = await imgService.getOne({
          query: slide.imageQuery,
          width: 800,
          height: 600
        });
        if (img) {
          slide.imageUrl = img.url;
          imgCount++;
        }
      }
    }
    console.log(`  [OK] Added ${imgCount} AI-generated images`);
  } else {
    console.log('\n[Step 1] Mock content (no API key)...');
    content = {
      title: 'How AI is Reshaping the Future of Work',
      subtitle: 'A TED-style Talk',
      estimatedDuration: 15,
      slides: [
        { title: '60% of Jobs Will Be Transformed by AI in This Decade', type: 'cover', content: ['A TED-style talk', 'Robinji | 2026'] },
        { title: 'Agenda', type: 'agenda', content: ['The disruption', 'Three forces', 'A day in 2030', 'What you can do'] },
        { title: '60% of Jobs Will Be Transformed by AI in This Decade', type: 'kpi', kpiValue: '60%', kpiUnit: 'of jobs', kpiContext: 'WILL BE TRANSFORMED BY AI BY 2030' },
        { title: 'Most People Are Unprepared for This Change', type: 'content', content: ['Only 14% feel ready for AI-driven changes', 'Reskilling programs cover less than 30% of workforce', 'Average worker has 3.2 years to adapt'] },
        { title: 'Three Forces Reshaping Work', type: 'process', steps: [
          { title: 'AI Coworkers', description: 'AI as daily collaborator' },
          { title: 'Task Automation', description: '50% of tasks automatable' },
          { title: 'New Roles', description: '97M new positions by 2025' }
        ]},
        { title: 'Old Work vs New Work', type: 'comparison', comparisonA: { title: '2020', items: ['Manual repetitive tasks', '9-to-5 office', 'Linear career', 'Specialist'] }, comparisonB: { title: '2030', items: ['AI-augmented creativity', 'Flexible async work', 'Portfolio career', 'T-shaped expert'] } },
        { title: 'Productivity Gains from AI', type: 'chart', chartData: { type: 'bar', title: 'Productivity Gain %', labels: ['Writing', 'Coding', 'Analysis', 'Design', 'Customer Service'], values: [40, 55, 35, 50, 60] } },
        { title: 'Timeline: Adoption Curve', type: 'timeline', events: [
          { date: '2024', title: 'GenAI Goes Mainstream' },
          { date: '2026', title: '40% of Companies Use AI' },
          { date: '2028', title: 'AI in Every Workflow' },
          { date: '2030', title: 'New Work Paradigm' }
        ]},
        { title: 'What This Means for You', type: 'divider', content: ['PART 2'] },
        { title: 'Three Skills That Will Define Winners', type: 'content', content: [
          'AI literacy - using AI tools daily',
          'Creativity - what AI cannot replicate',
          'Adaptability - learning how to learn'
        ]},
        { title: 'Start Today: Your 30-Day AI Plan', type: 'cta', content: [
          'Use AI for 1 task daily for 30 days',
          'Start now: github.com/robinji-ai-plan'
        ]},
        { title: 'Thank You - Lets Build the Future Together', type: 'thank-you', content: ['hello@robinji.com', 'robinji.com'] }
      ]
    };
  }

  // A11y check
  console.log('\n[Step 3] A11y Accessibility Check...');
  const tpl = getTemplate('tech-neon');
  const a11yReport = checkA11y(content, tpl.palette);
  console.log(`  [OK] Score: ${a11yReport.score}/100`);
  console.log(`  ${a11yReport.summary}`);

  // PPT creation with all features
  console.log('\n[Step 4] PPT Creation (full features)...');
  const outputPath = join(OUTPUT_DIR, 'FINAL-DEMO.pptx');
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
  console.log(`  [OK] FINAL-DEMO.pptx created (${(stats.size / 1024).toFixed(1)} KB)`);

  // 统计
  console.log('\n====================================================');
  console.log('  FEATURE SUMMARY');
  console.log('====================================================');
  console.log(`  AI Generated:    ${content.slides.length} slides`);
  console.log(`  Estimated Time:  ${content.estimatedDuration} min`);
  console.log(`  Slide Types:     ${[...new Set(content.slides.map(s => s.type))].length} unique types`);
  console.log(`  Images:          ${content.slides.filter(s => s.imageUrl).length} embedded`);
  console.log(`  Template:        tech-neon (16 available)`);
  console.log(`  Brand:           Logo + Footer + Company name`);
  console.log(`  A11y Score:      ${a11yReport.score}/100 (WCAG AA)`);
  console.log(`  File Size:       ${(stats.size / 1024).toFixed(1)} KB`);
  console.log('====================================================');
  console.log('\n[Done] Final demo complete!');
}

run().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
