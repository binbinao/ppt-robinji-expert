import { config } from 'dotenv';
import { existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import PPTCreator from '../src/pptx/creator.js';
import ImageService from '../src/image/image-service.js';
import { checkA11y } from '../src/pptx/a11y-checker.js';
import { getTemplate } from '../src/pptx/templates/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = '/Users/jiduobin/Documents/GitHub/ppt-robinji-expert/output';

config({ path: '/Users/jiduobin/Documents/GitHub/ppt-robinji-expert/ppt-robinji/.env', quiet: true });

// 完整 TED 风格的内容：如何学习 AI 技能
const content = {
  title: 'How to Learn AI Skills: A Practical Guide',
  subtitle: 'From Beginner to Production in 90 Days',
  estimatedDuration: 12,
  slides: [
    {
      title: '90% of Developers Will Need AI Skills by 2027',
      type: 'cover',
      content: ['A practical guide for developers', 'Robinji AI | 2026']
    },
    {
      title: 'What You Will Learn Today',
      type: 'agenda',
      content: [
        'Why AI skills are urgent',
        'The 4-stage learning roadmap',
        'Hands-on practice framework',
        'Resources and next steps'
      ]
    },
    {
      title: 'AI Skills Demand Doubled in 18 Months',
      type: 'kpi',
      kpiValue: '2.3x',
      kpiUnit: 'demand',
      kpiContext: 'GLOBAL AI ENGINEER JOB POSTINGS GROWTH'
    },
    {
      title: 'Most People Learn AI Skills the Wrong Way',
      type: 'content',
      content: [
        'Jumping to frameworks before understanding fundamentals',
        'Watching 100 hours of tutorials without building anything',
        'Avoiding math and skipping core concepts',
        'Following hype instead of solving real problems'
      ]
    },
    {
      title: 'The 4-Stage AI Skills Roadmap',
      type: 'process',
      steps: [
        { title: 'Foundations', description: 'Math, Python, ML basics (4 weeks)' },
        { title: 'Core ML', description: 'Models, training, evaluation (6 weeks)' },
        { title: 'LLM & Tools', description: 'Prompting, RAG, agents (4 weeks)' },
        { title: 'Production', description: 'Deploy, monitor, scale (2 weeks)' }
      ]
    },
    {
      title: 'Build in Public: Learning by Doing',
      type: 'comparison',
      comparisonA: { title: 'PASSIVE LEARNING', items: ['Watch tutorials', 'Read papers', 'Take notes', 'No output'] },
      comparisonB: { title: 'ACTIVE LEARNING', items: ['Build projects', 'Share on GitHub', 'Write blog posts', 'Daily commits'] }
    },
    {
      title: 'Your 30-Day Quick Start Plan',
      type: 'cta',
      content: [
        'Week 1-2: Python + NumPy + Pandas fundamentals',
        'Week 3-4: First ML model on real dataset',
        'github.com/robinji/ai-30-day-challenge'
      ]
    },
    {
      title: 'Thank You - Start Building Today',
      type: 'thank-you',
      content: ['hello@robinji.com', 'robinji.com/ai-skills']
    }
  ]
};

async function main() {
  console.log('====================================================');
  console.log('  [ppt-robinji] Generating PPT');
  console.log('  Topic: How to Learn AI Skills');
  console.log('====================================================');

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('\n[Step 1] Content (curated TED-style structure)');
  console.log(`  Title: ${content.title}`);
  console.log(`  Slides: ${content.slides.length}`);
  console.log(`  Types: ${[...new Set(content.slides.map(s => s.type))].join(', ')}`);

  console.log('\n[Step 2] Fetching images via Pollinations AI...');
  const imgService = new ImageService('pollinations');
  let imgCount = 0;
  for (const slide of content.slides) {
    const query = slide.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').slice(0, 50);
    if (query) {
      try {
        const img = await imgService.getOne({ query: query + ' learning guide', width: 800, height: 600 });
        if (img) { slide.imageUrl = img.url; imgCount++; }
      } catch (e) { /* skip */ }
    }
  }
  console.log(`  [OK] Added ${imgCount} AI-generated images`);

  console.log('\n[Step 3] Creating PPT with brand...');
  const outputPath = join(OUTPUT_DIR, 'how-to-learn-ai-skills.pptx');
  const creator = new PPTCreator({
    template: 'tech-neon',
    author: 'ppt-robinji',
    company: 'Robinji AI',
    logo: 'R',
    footerText: 'Robinji AI | robinji.com',
    showFooter: true
  });
  await creator.createFromOutline(content);
  await creator.save(outputPath);
  const stats = statSync(outputPath);
  console.log(`  [OK] ${outputPath.split('/').pop()} (${(stats.size / 1024).toFixed(1)} KB)`);

  console.log('\n[Step 4] A11y check...');
  const tpl = getTemplate('tech-neon');
  const a11y = checkA11y(content, tpl.palette);
  console.log(`  [OK] Score: ${a11y.score}/100 - ${a11y.summary}`);

  console.log('\n====================================================');
  console.log('  [SUCCESS] PPT GENERATED');
  console.log('====================================================');
  console.log('  File:    ' + outputPath);
  console.log('  Size:    ' + (stats.size / 1024).toFixed(1) + ' KB');
  console.log('  Slides:  ' + content.slides.length);
  console.log('  A11y:    ' + a11y.score + '/100');
  console.log('====================================================\n');
}

main().catch(err => { console.error(err); process.exit(1); });
