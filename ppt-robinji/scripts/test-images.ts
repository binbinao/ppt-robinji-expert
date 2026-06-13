#!/usr/bin/env node

// Image service test
// Validates multiple image sources + AI generated content with images + rendering

import { config } from 'dotenv';
import { existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import ImageService from '../src/image/image-service.js';
import { getAllImageProviders } from '../src/image/providers-config.js';
import AIGenerator from '../src/ai/generator.js';
import PPTCreator from '../src/pptx/creator.js';
import type { PPTContent } from '../src/ai/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, '../output');

config({ path: join(__dirname, '../.env'), quiet: true });

async function listImageProviders() {
  console.log('\n[Image Providers]');
  console.log('-'.repeat(80));
  const all = getAllImageProviders();
  for (const p of all) {
    const keyStatus = !p.requiresKey ? '[OK]' :
      (process.env[p.apiKeyEnv!] ? '[OK]' : '[NEED KEY]');
    const enabledStatus = p.enabled ? 'enabled' : 'disabled';
    console.log(`  ${p.emoji} ${p.id.padEnd(15)} ${p.name.padEnd(20)} ${p.type.padEnd(10)} ${keyStatus.padEnd(15)} ${enabledStatus}`);
    console.log(`     ${p.description}`);
  }
}

async function testPicsum() {
  console.log('\n\n[Test 1] Picsum random images');
  console.log('-'.repeat(80));
  const service = new ImageService('picsum');
  const results = await service.search({
    query: 'modern office',
    count: 3,
    width: 800,
    height: 600
  });
  console.log(`[OK] Returned ${results.length} images:`);
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.url.substring(0, 80)}...`);
    console.log(`     Size: ${r.width}x${r.height} | Source: ${r.source}`);
  });
  return results;
}

async function testPollinations() {
  console.log('\n\n[Test 2] Pollinations AI generation');
  console.log('-'.repeat(80));
  const service = new ImageService('pollinations');
  const results = await service.search({
    query: 'A futuristic AI robot working in a modern smart office',
    count: 2,
    width: 1024,
    height: 768,
    style: 'photographic'
  });
  console.log(`[OK] AI generated ${results.length} images:`);
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.url.substring(0, 80)}...`);
    console.log(`     Prompt: ${r.prompt}`);
  });
  return results;
}

function mockContent(): PPTContent {
  return {
    title: 'AI in Education',
    subtitle: 'Intelligent Teaching New Era',
    slides: [
      {
        title: 'Intro: Rise of AI Education',
        type: 'content',
        content: ['Global education AI market exceeds 350 billion USD', 'AI personalized learning becomes mainstream'],
        imageQuery: 'AI education modern classroom',
        imagePrompt: 'A modern classroom with AI-powered interactive screens',
        imagePosition: 'right'
      },
      {
        title: 'Smart Tutoring System',
        type: 'content',
        content: ['24/7 online Q&A', 'Adaptive learning paths', 'Multi-modal interaction'],
        imageQuery: 'AI tutor robot student',
        imagePrompt: 'An AI tutor robot helping a student with homework',
        imagePosition: 'right'
      },
      {
        title: 'Challenges and Future',
        type: 'content',
        content: ['Data privacy protection', 'Education equity', 'Tech ethics'],
        imageQuery: 'future education technology',
        imagePrompt: 'A futuristic vision of education with holographic displays',
        imagePosition: 'right'
      }
    ]
  };
}

async function testAIGeneratedContent(): Promise<PPTContent | null> {
  console.log('\n\n[Test 3] AI generated content with images');
  console.log('-'.repeat(80));

  if (!process.env.MINIMAX_API_KEY && !process.env.DEEPSEEK_API_KEY
    && !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    console.log('[SKIP] No API key, using mock content');
    return mockContent();
  }

  const generator = new AIGenerator();
  console.log('Calling AI to generate content with image info...');
  const content = await generator.generateOutline({
    topic: '2026 AI in Education',
    slides: 4,
    style: 'professional'
  });

  console.log(`[OK] Generated ${content.slides.length} slides`);
  console.log('\nImage info preview:');
  content.slides.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.title}`);
    console.log(`     imageQuery: ${s.imageQuery || '(none)'}`);
    console.log(`     imagePrompt: ${s.imagePrompt?.substring(0, 80) || '(none)'}`);
    console.log(`     imagePosition: ${s.imagePosition || '(none)'}`);
  });

  return content;
}

async function testFullPipeline(provider: string) {
  console.log(`\n\n[Test 4] Full pipeline - AI content + ${provider} images + PPT`);
  console.log('-'.repeat(80));

  const content = await testAIGeneratedContent();
  if (!content) return null;

  const imageService = new ImageService(provider);
  console.log(`\nFetching images for ${content.slides.length} slides...`);

  for (const slide of content.slides) {
    if (slide.imageQuery && !slide.imageUrl) {
      try {
        const img = await imageService.getOne({
          query: slide.imageQuery,
          width: 800,
          height: 600,
          orientation: 'landscape'
        });
        if (img) {
          slide.imageUrl = img.url;
          console.log(`  [OK] ${slide.title.substring(0, 30)} -> ${img.url.substring(0, 60)}...`);
        }
      } catch (error) {
        console.warn(`  [WARN] ${slide.title}: image fetch failed`);
      }
    }
  }

  const outputPath = join(OUTPUT_DIR, `images-${provider}-full.pptx`);
  console.log(`\nGenerating PPT: ${outputPath}`);
  const creator = new PPTCreator({ template: 'business-classic', author: 'image-test' });
  await creator.createFromOutline(content);
  await creator.save(outputPath);

  const stats = statSync(outputPath);
  console.log(`[OK] PPT generated (${(stats.size / 1024).toFixed(1)} KB)`);

  return { outputPath, content };
}

async function testDifferentPositions() {
  console.log('\n\n[Test 5] 4 image positions');
  console.log('-'.repeat(80));

  const positions: Array<'left' | 'right' | 'top' | 'bottom'> = ['left', 'right', 'top', 'bottom'];
  const imageService = new ImageService('picsum');

  for (const pos of positions) {
    const img = await imageService.getOne({
      query: `${pos} position test image`,
      width: 800,
      height: 600
    });

    const content: PPTContent = {
      title: 'Image Position Test',
      subtitle: `Image at ${pos.toUpperCase()}`,
      slides: [
        {
          title: `Image at ${pos} position`,
          type: 'content',
          content: [
            'Text content next to image',
            'Second bullet point',
            'Third supplementary info',
            'Image auto-adjusts size based on position'
          ],
          imageUrl: img?.url,
          imagePosition: pos
        }
      ]
    };

    const outputPath = join(OUTPUT_DIR, `image-position-${pos}.pptx`);
    const creator = new PPTCreator({ template: 'tech-neon', author: 'position-test' });
    await creator.createFromOutline(content);
    await creator.save(outputPath);
    const stats = statSync(outputPath);
    console.log(`  [OK] [${pos.padEnd(6)}] image-position-${pos}.pptx (${(stats.size / 1024).toFixed(1)} KB)`);
  }
}

async function main() {
  console.log('=====================================================');
  console.log('  ppt-robinji Image Service Test');
  console.log('=====================================================');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  await listImageProviders();
  await testPicsum();
  await testPollinations();
  await testFullPipeline('picsum');
  await testFullPipeline('pollinations');
  await testDifferentPositions();

  console.log('\n\n[Done] All tests completed!');
  console.log(`\nGenerated files:`);
  console.log(`  - images-picsum-full.pptx      - Picsum random + AI content`);
  console.log(`  - images-pollinations-full.pptx - AI generated + AI content`);
  console.log(`  - image-position-left.pptx     - Image left layout`);
  console.log(`  - image-position-right.pptx    - Image right layout`);
  console.log(`  - image-position-top.pptx      - Image top layout`);
  console.log(`  - image-position-bottom.pptx   - Image bottom layout`);
}

main().catch(err => {
  console.error('[ERROR] Test failed:', err);
  process.exit(1);
});
