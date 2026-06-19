#!/usr/bin/env node
/**
 * 集成测试：源文档 → AI 提示 → PPT
 */

import { writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseSourceFile, estimateSlideCount } from '../src/source/index.js';
import { sourceToPromptText } from '../src/source/to-prompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DIR = join(__dirname, '../.test-tmp/integration');

async function setup() {
  await mkdir(TEST_DIR, { recursive: true });
}

async function cleanup() {
  try {
    await rm(TEST_DIR, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

async function main() {
  await setup();
  try {
    // 准备一个示例文档
    const mdFile = join(TEST_DIR, 'lecture.md');
    await writeFile(
      mdFile,
      `# Deep Learning Fundamentals

A comprehensive overview of deep learning for beginners.

## What is Deep Learning?

Deep learning is a subset of machine learning that uses neural networks
with many layers. It has revolutionized AI in the past decade.

## Key Architectures

- CNN: Convolutional Neural Networks for images
- RNN: Recurrent Neural Networks for sequences
- Transformer: Attention-based models for NLP

## Applications

1. Computer Vision
2. Natural Language Processing
3. Speech Recognition
4. Game Playing (AlphaGo)
`,
      'utf-8'
    );

    console.log('=== 集成测试：源文档 → 提示 ===\n');

    const source = await parseSourceFile(mdFile);
    console.log('1. 解析结果:');
    console.log(`   - title: ${source.title}`);
    console.log(`   - sourceType: ${source.sourceType}`);
    console.log(`   - sections: ${source.sections?.length}`);
    console.log(`   - text length: ${source.text.length} chars\n`);

    console.log('2. 段落结构:');
    source.sections?.forEach((s, i) => {
      console.log(`   [${i}] L${s.level}: ${s.heading || '(no heading)'} - ${s.content.length} chars`);
    });

    console.log('\n3. AI 提示预览 (前 500 字符):');
    const prompt = sourceToPromptText(source, { maxSections: 3, maxSectionLength: 200 });
    console.log(prompt.substring(0, 500));
    console.log('...\n');

    const slides = estimateSlideCount(source);
    console.log(`4. 估算幻灯片数: ${slides}`);

    console.log('\n✅ 集成测试通过');
  } finally {
    await cleanup();
  }
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
