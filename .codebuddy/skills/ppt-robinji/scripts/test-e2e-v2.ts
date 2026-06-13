#!/usr/bin/env node

// End-to-end real AI test using new speech methodology
// Calls MiniMax M3 to generate TED-style content with 14 slide types

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

async function generatePPT(topic: string, structure: string, template: string, imageProvider: string) {
  console.log(`\n[Generating] Topic: ${topic}`);
  console.log(`  Structure: ${structure} | Template: ${template} | Image: ${imageProvider}`);

  // Step 1: AI content generation
  const generator = new AIGenerator();
  console.log('  Step 1: Calling AI to generate content...');
  const content = await generator.generateOutline({
    topic,
    slides: 10,
    style: 'persuasive',
    structure: structure as any
  });

  console.log(`  [OK] AI generated ${content.slides.length} slides`);
  console.log(`  Types: ${content.slides.map(s => s.type).join(', ')}`);

  // Step 2: Image generation/search
  const imageService = new ImageService(imageProvider);
  console.log('  Step 2: Fetching images...');
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
        }
      } catch (err) {
        // Silently skip
      }
    }
  }

  // Step 3: PPT generation
  const outputPath = join(OUTPUT_DIR, `e2e-${structure}-${template}.pptx`);
  console.log('  Step 3: Creating PPT...');
  const creator = new PPTCreator({ template, author: 'e2e-v2' });
  await creator.createFromOutline(content);
  await creator.save(outputPath);

  const stats = statSync(outputPath);
  console.log(`  [OK] PPT created: ${outputPath.split('/').pop()} (${(stats.size / 1024).toFixed(1)} KB)`);

  return { content, outputPath };
}

async function main() {
  console.log('=====================================================');
  console.log('  ppt-robinji E2E Real AI Test (V2)');
  console.log('=====================================================');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (!process.env.MINIMAX_API_KEY && !process.env.DEEPSEEK_API_KEY
    && !process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    console.log('[ERROR] No API key found. Please set MINIMAX_API_KEY in .env');
    process.exit(1);
  }

  // Test 1: TED-style talk
  await generatePPT(
    'Why AI Will Transform Education by 2030',
    'ted',
    'tech-neon',
    'picsum'
  );

  // Wait between API calls to avoid rate limits
  console.log('\n[Wait] Pausing 30s to avoid rate limits...');
  await new Promise(r => setTimeout(r, 30000));

  // Test 2: Investor pitch
  await generatePPT(
    'Robinji AI - Series A Pitch Deck',
    'pitch',
    'business-elegant',
    'pollinations'
  );

  console.log('\n\n[Done] E2E Test Complete!');
}

main().catch(err => {
  console.error('[ERROR]', err);
  process.exit(1);
});
