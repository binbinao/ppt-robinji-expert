#!/usr/bin/env node
/**
 * 端到端集成测试：源文档 → AI 提示 → PPT（含动画）
 */

import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseSourceFile } from '../src/source/index.js';
import { sourceToPromptText } from '../src/source/to-prompt.js';
import { PPTCreator } from '../src/pptx/creator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DIR = join(__dirname, '../.test-tmp/e2e');

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
    // 1. 准备源文档
    const mdFile = join(TEST_DIR, 'lecture.md');
    await writeFile(
      mdFile,
      `# AI Revolution

A comprehensive overview of the AI revolution.

## What is AI?

AI is transforming every industry.

## Applications

- Healthcare
- Finance
- Education
`,
      'utf-8'
    );

    console.log('=== E2E: Source → PPT with Animation ===\n');

    // 2. 解析源
    const source = await parseSourceFile(mdFile);
    console.log('1. Parsed source:', source.title, `(${source.sections?.length} sections)`);

    // 3. 生成提示
    const prompt = sourceToPromptText(source);
    console.log('2. Generated prompt (first 200 chars):', prompt.substring(0, 200).replace(/\n/g, ' / '));

    // 4. 模拟 AI 输出（用 mock 数据，不依赖 API key）
    const mockContent = {
      title: source.title,
      subtitle: 'A Test',
      estimatedDuration: 3,
      totalScriptLength: 500,
      slides: [
        {
          title: 'Welcome to AI Revolution',
          type: 'cover' as const,
          content: ['Transforming the future', 'Test Author'],
          notes: 'Introduction',
        },
        {
          title: 'What You Will Learn',
          type: 'agenda' as const,
          content: ['AI Basics', 'Applications', 'Future Trends'],
          notes: 'Agenda',
        },
        {
          title: '1 Million Users',
          type: 'kpi' as const,
          kpiValue: '1M',
          kpiUnit: 'users',
          kpiContext: 'GLOBAL AI ADOPTION',
          content: [],
          notes: 'Big number',
        },
        {
          title: 'Key Sectors',
          type: 'content' as const,
          content: ['Healthcare', 'Finance', 'Education'],
          notes: 'Sectors',
        },
        {
          title: 'Thank You',
          type: 'thank-you' as const,
          content: ['Contact: test@example.com'],
          notes: 'End',
        },
      ],
    };

    // 5. 创建带动画的 PPT
    const creator = new PPTCreator({
      template: 'business-classic',
      company: 'Test Co.',
    });
    await creator.createFromOutline(mockContent as any);
    const output = join(TEST_DIR, 'animated.pptx');
    await creator.save(output);

    // 6. 验证输出
    const JSZip = (await import('jszip')).default;
    const buf = await readFile(output);
    const zip = await JSZip.loadAsync(buf);

    let transitions = 0;
    const slideFiles = Object.keys(zip.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f));
    for (const f of slideFiles) {
      const xml = await zip.file(f)?.async('string');
      if (xml?.includes('<p:transition')) transitions++;
    }

    console.log(`\n3. Generated ${slideFiles.length} slides with ${transitions} transitions`);
    console.log('4. Output file:', output);

    if (transitions > 0) {
      console.log(`\n✅ E2E test passed! ${transitions}/${slideFiles.length} slides have transitions`);
    } else {
      console.log('\n❌ No transitions applied!');
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
