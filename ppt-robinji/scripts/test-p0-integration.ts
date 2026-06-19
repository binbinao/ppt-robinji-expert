#!/usr/bin/env node
/**
 * P0 三特性综合 E2E 演示
 *
 * 流程：源文档 → 解析 → AI 提示 → PPT（带动画 + 原生形状）
 */

import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseSourceFile } from '../src/source/index.js';
import { sourceToPromptText } from '../src/source/to-prompt.js';
import { PPTCreator } from '../src/pptx/creator.js';
import { parseSVG, buildShapeXml, star, arrow } from '../src/pptx/native/index.js';
import { injectXML } from '../src/pptx/native/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DIR = join(__dirname, '../.test-tmp/p0-integration');

async function setup() {
  await mkdir(TEST_DIR, { recursive: true });
}

async function cleanup() {
  try { await rm(TEST_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
}

async function main() {
  await setup();
  try {
    console.log('=====================================================');
    console.log('  P0 Integration: Source + Animation + Native Shape');
    console.log('=====================================================\n');

    // Step 1: 源文档
    const mdFile = join(TEST_DIR, 'topic.md');
    await writeFile(
      mdFile,
      `# AI in Education

A revolutionary change in how we learn.

## Why AI?

- Personalized learning paths
- Automated grading
- 24/7 tutoring availability

## Results

Student outcomes improve by 60% on average.
`,
      'utf-8'
    );

    const source = await parseSourceFile(mdFile);
    console.log('[1] Source parsed:', source.title, `(${source.sections?.length} sections)`);

    const prompt = sourceToPromptText(source);
    console.log('[2] AI prompt length:', prompt.length, 'chars');

    // Step 2: Mock AI 输出
    const mockContent = {
      title: source.title,
      subtitle: 'Transforming Learning',
      slides: [
        {
          title: 'AI in Education',
          type: 'cover' as const,
          content: ['A new era of learning', '2026'],
          transition: { type: 'fade', duration: 800 } as any,
        },
        {
          title: 'Agenda',
          type: 'agenda' as const,
          content: ['Why AI?', 'Results', 'Future'],
        },
        {
          title: '60% Improvement',
          type: 'kpi' as const,
          kpiValue: '60%',
          kpiContext: 'STUDENT OUTCOMES',
          content: [],
        },
        {
          title: 'Key Benefits',
          type: 'content' as const,
          content: ['Personalized paths', 'Auto grading', '24/7 tutoring'],
        },
        {
          title: 'Thank You',
          type: 'thank-you' as const,
          content: ['Contact: hello@example.com'],
        },
      ],
    };

    // Step 3: 创建带动画的 PPT
    const creator = new PPTCreator({
      template: 'tech-neon',
      company: 'AI Edu',
    });
    await creator.createFromOutline(mockContent as any);
    const intermediatePath = join(TEST_DIR, 'intermediate.pptx');
    await creator.save(intermediatePath);
    console.log('[3] PPT created with auto animations');

    // Step 4: 通过 SVG 注入自定义形状（原生 DrawingML）
    const customSvg = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="200" height="100" fill="#FF6B35" rx="10"/>
        <circle cx="300" cy="50" r="40" fill="#FFD23F"/>
        <polygon points="0,0 50,50 0,100" fill="#06A77D"/>
      </svg>
    `;
    const shapes = parseSVG(customSvg);
    console.log(`[4] Parsed ${shapes.length} SVG shapes`);

    // 5. 添加 SVG 形状 + 原生 star 到第 4 张幻灯片
    const svgXmls = shapes.map((s, i) => buildShapeXml(s, `SvgShape${i + 1}`, 100 + i)).join('\n');
    const starShape = star({ outerRadius: 1, innerRadius: 0.4, points: 5 });
    const starXml = buildShapeXml({
      prst: 'custGeom',
      geometryXml: starShape.geometryXml,
      x: 4 * 9525 * 600000, // 4 inches
      y: 1 * 9525 * 600000,
      width: starShape.width * 9525 * 200000, // 0.4 inch
      height: starShape.height * 9525 * 200000,
      fill: 'FFD700',
    }, 'NativeStar', 200);

    const finalPath = await injectXML(intermediatePath, svgXmls + starXml, {
      targetSlide: 4,
      position: 'spTree',
    });
    console.log('[5] Native SVG + star shapes injected into slide 4');

    // Step 6: 验证最终文件
    const JSZip = (await import('jszip')).default;
    const buf = await readFile(finalPath);
    const zip = await JSZip.loadAsync(buf);

    let transitions = 0;
    let nativeShapes = 0;
    const slideFiles = Object.keys(zip.files).filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f));

    for (const f of slideFiles) {
      const xml = await zip.file(f)?.async('string');
      if (xml?.includes('<p:transition')) transitions++;
      if (xml?.includes('SvgShape') || xml?.includes('NativeStar')) nativeShapes++;
    }

    console.log('\n=== 最终统计 ===');
    console.log(`  Total slides: ${slideFiles.length}`);
    console.log(`  Slides with transitions: ${transitions}`);
    console.log(`  Slides with native shapes: ${nativeShapes}`);
    console.log(`  Output: ${finalPath}`);

    const allChecks = slideFiles.length > 0 &&
                     transitions > 0 &&
                     nativeShapes > 0;
    if (allChecks) {
      console.log('\n✅ P0 Integration E2E test PASSED');
    } else {
      console.log('\n❌ P0 Integration E2E test FAILED');
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
