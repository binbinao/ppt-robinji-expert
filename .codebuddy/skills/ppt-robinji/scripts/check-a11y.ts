#!/usr/bin/env node

// A11y (Accessibility) Check
// Validates PPT content for color contrast, font size, content length

import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import AIGenerator from '../src/ai/generator.js';
import { getTemplate } from '../src/pptx/templates/index.js';
import { checkA11y } from '../src/pptx/a11y-checker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env'), quiet: true });

async function main() {
  console.log('=====================================================');
  console.log('  ppt-robinji A11y Accessibility Check');
  console.log('=====================================================');

  // 生成一个测试 PPT
  let content;
  if (process.env.MINIMAX_API_KEY || process.env.DEEPSEEK_API_KEY
    || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) {
    console.log('\n[Step 1] Generating content with AI...');
    const generator = new AIGenerator();
    content = await generator.generateOutline({
      topic: 'Best Practices for Remote Work',
      slides: 8,
      structure: 'ted'
    });
    console.log(`[OK] Generated ${content.slides.length} slides`);
  } else {
    console.log('\n[Step 1] Using mock content (no API key)...');
    content = {
      title: 'Best Practices for Remote Work',
      subtitle: 'Productivity in the New Normal',
      slides: [
        { title: 'Remote Work is the New Normal', type: 'cover', content: ['42% of workforce is now remote', 'Robinji 2026'] },
        { title: 'Agenda', type: 'agenda', content: ['Setup', 'Communication', 'Deep Work', 'Wellness'] },
        { title: '4.2 Days', type: 'kpi', kpiValue: '4.2', kpiUnit: 'days/week', kpiContext: 'AVERAGE REMOTE DAYS' },
        { title: 'Build a Dedicated Workspace', type: 'content', content: [
          'Separate physical space for work',
          'Ergonomic chair and proper lighting',
          'External monitor increases productivity by 25%',
          'Plants improve air quality and mood'
        ]},
        { title: 'Communication Rituals', type: 'content', content: [
          'Daily 15-min standup',
          'Async-first communication',
          'Camera-on for important meetings'
        ]},
        { title: 'Setup vs Distraction', type: 'comparison', comparisonA: { title: 'POOR SETUP', items: ['Couch', 'Phone nearby', 'Random apps'] }, comparisonB: { title: 'GOOD SETUP', items: ['Desk', 'Phone away', 'Focus mode'] } },
        { title: 'Questions?', type: 'qa' },
        { title: 'Thank You', type: 'thank-you', content: ['hello@company.com'] }
      ]
    };
  }

  // 检查多个模板
  const templates = ['business-classic', 'tech-neon', 'minimal-paper', 'gradient-ocean', 'creative-aurora'];

  for (const tplId of templates) {
    const tpl = getTemplate(tplId);
    console.log(`\n[Template: ${tplId}]`);
    console.log('-'.repeat(80));

    const report = checkA11y(content, tpl.palette);

    // 评分可视化
    const scoreBar = '='.repeat(Math.floor(report.score / 5));
    const emptyBar = ' '.repeat(20 - scoreBar.length);
    console.log(`  Score: [${scoreBar}${emptyBar}] ${report.score}/100`);
    console.log(`  ${report.summary}`);
    console.log(`  Slides: ${report.totalSlides} | Issues: ${report.totalIssues} (${report.errors} errors, ${report.warnings} warnings)`);

    if (report.issues.length > 0 && report.issues.length <= 5) {
      console.log(`\n  Top issues:`);
      report.issues.slice(0, 5).forEach(issue => {
        const icon = issue.level === 'error' ? 'X' : '!';
        console.log(`    [${icon}] Slide ${issue.slideIndex + 1}: ${issue.message}`);
        if (issue.suggestion) {
          console.log(`        -> ${issue.suggestion}`);
        }
      });
    }
  }

  console.log('\n\n[Done] A11y check complete.');
  console.log('\n[A11y Tips]');
  console.log('  - WCAG AA: contrast >= 4.5:1 for normal text');
  console.log('  - WCAG AAA: contrast >= 7:1 for optimal');
  console.log('  - Min font size: 16pt for body, 24pt for titles');
  console.log('  - One idea per slide: 3-5 bullets max');
  console.log('  - Use icons + text, not color alone');
}

main().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
