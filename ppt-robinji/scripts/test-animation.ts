#!/usr/bin/env node
/**
 * Animation 模块测试
 */

import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import PptxGenJS from 'pptxgenjs';
import { AnimationManager } from '../src/pptx/animation/manager.js';
import type { TransitionOptions, ShapeAnimation } from '../src/pptx/animation/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DIR = join(__dirname, '../.test-tmp/animation');

let passed = 0;
let failed = 0;

function log(level: 'INFO' | 'OK' | 'FAIL' | 'TEST', msg: string) {
  const colors = {
    INFO: '\x1b[36m',
    OK: '\x1b[32m',
    FAIL: '\x1b[31m',
    TEST: '\x1b[35m',
  };
  const reset = '\x1b[0m';
  console.log(`${colors[level]}[${level}]${reset} ${msg}`);
}

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    log('OK', msg);
  } else {
    failed++;
    log('FAIL', msg);
  }
}

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

async function createBasePptx(filePath: string, slideCount = 3): Promise<void> {
  const pres = new PptxGenJS();
  for (let i = 0; i < slideCount; i++) {
    const slide = pres.addSlide();
    slide.addText(`Slide ${i + 1}`, {
      x: 1, y: 2, w: 8, h: 1.5,
      fontSize: 36, color: '333333', align: 'center'
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 4, y: 4, w: 2, h: 0.05,
      fill: { color: '0066CC' }
    });
  }
  await pres.writeFile({ fileName: filePath });
}

async function testFadeTransition() {
  log('TEST', '=== Fade Transition ===');
  const file = join(TEST_DIR, 'fade.pptx');
  await createBasePptx(file, 3);

  const mgr = new AnimationManager();
  const output = await mgr.applyAnimations(file, [
    { transition: { type: 'fade', duration: 500 } },
    { transition: { type: 'fade', duration: 500 } },
    { transition: { type: 'fade', duration: 500 } },
  ]);

  // 验证输出文件存在
  const buf = await readFile(output);
  assert(buf.length > 1000, `output file has content (${buf.length} bytes)`);

  // 验证输出包含 transition XML
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buf);
  const slide1 = await zip.file('ppt/slides/slide1.xml')?.async('string');
  assert(slide1 !== undefined, 'slide1.xml exists in zip');
  assert(slide1!.includes('<p:transition'), 'slide1.xml contains <p:transition>');
  assert(slide1!.includes('<p:fade/>'), 'slide1.xml contains <p:fade/>');
}

async function testAllTransitionTypes() {
  log('TEST', '=== All Transition Types ===');
  const types: TransitionOptions['type'][] = [
    'fade', 'push', 'wipe', 'cover', 'cut',
    'split', 'reveal', 'circle', 'diamond', 'plus',
    'wedge', 'zoom', 'honeycomb', 'flash', 'vortex',
    'ripple', 'glitter', 'newsflash', 'fall', 'drape',
    'curtains', 'wind', 'prestige', 'fracture', 'crush',
    'peeloff', 'pageturn', 'pan', 'random'
  ];

  const mgr = new AnimationManager();
  for (const type of types) {
    const file = join(TEST_DIR, `t-${type}.pptx`);
    await createBasePptx(file, 1);
    const output = await mgr.applyAnimations(file, [
      { transition: { type, duration: 700 } },
    ]);
    const JSZip = (await import('jszip')).default;
    const buf = await readFile(output);
    const zip = await JSZip.loadAsync(buf);
    const slide1 = await zip.file('ppt/slides/slide1.xml')?.async('string');
    const hasTransition = slide1?.includes('<p:transition') ?? false;
    assert(hasTransition, `${type}: slide contains <p:transition>`);
  }
}

async function testDirectionParameter() {
  log('TEST', '=== Direction Parameter ===');
  const file = join(TEST_DIR, 'dir.pptx');
  await createBasePptx(file, 1);

  const mgr = new AnimationManager();
  const output = await mgr.applyAnimations(file, [
    { transition: { type: 'split', duration: 700, direction: 'l' } },
  ]);
  const JSZip = (await import('jszip')).default;
  const buf = await readFile(output);
  const zip = await JSZip.loadAsync(buf);
  const slide1 = await zip.file('ppt/slides/slide1.xml')?.async('string');
  assert(slide1!.includes('dir="l"'), 'split with direction l has dir attr');
}

async function testNoTransition() {
  log('TEST', '=== No Transition (type=none) ===');
  const file = join(TEST_DIR, 'none.pptx');
  await createBasePptx(file, 1);

  const mgr = new AnimationManager();
  const output = await mgr.applyAnimations(file, [
    { transition: { type: 'none' } },
  ]);
  const JSZip = (await import('jszip')).default;
  const buf = await readFile(output);
  const zip = await JSZip.loadAsync(buf);
  const slide1 = await zip.file('ppt/slides/slide1.xml')?.async('string');
  assert(!slide1!.includes('<p:transition'), 'no transition XML when type=none');
}

async function testDefaultAnimations() {
  log('TEST', '=== Default Animations Static Method ===');
  const { AnimationManager } = await import('../src/pptx/animation/manager.js');
  const file = join(TEST_DIR, 'default.pptx');
  await createBasePptx(file, 4);

  const output = await AnimationManager.applyDefaultAnimations(file, [
    'cover', 'content', 'conclusion', 'thank-you'
  ]);

  const JSZip = (await import('jszip')).default;
  const buf = await readFile(output);
  const zip = await JSZip.loadAsync(buf);
  const slide1 = await zip.file('ppt/slides/slide1.xml')?.async('string');
  const slide4 = await zip.file('ppt/slides/slide4.xml')?.async('string');
  // cover 应该自动应用过渡
  assert(slide1!.includes('<p:transition'), 'cover has transition');
  // content 不在 autoTransitionTypes 中
  const slide2 = await zip.file('ppt/slides/slide2.xml')?.async('string');
  assert(!slide2!.includes('<p:transition'), 'content has no transition');
  // thank-you 应该在 autoTransitionTypes 中
  assert(slide4!.includes('<p:transition'), 'thank-you has transition');
}

async function testShapeAnimation() {
  log('TEST', '=== Shape Animation ===');
  const file = join(TEST_DIR, 'shapes.pptx');
  await createBasePptx(file, 1);

  const mgr = new AnimationManager();
  const animations: ShapeAnimation[] = [
    { type: 'fade', trigger: 'auto', duration: 500, delay: 0 },
    { type: 'scale', trigger: 'auto', duration: 600, delay: 200 },
  ];
  const output = await mgr.applyAnimations(file, [
    { shapeAnimations: animations },
  ], { enableShapeAnimations: true });

  const JSZip = (await import('jszip')).default;
  const buf = await readFile(output);
  const zip = await JSZip.loadAsync(buf);
  const slide1 = await zip.file('ppt/slides/slide1.xml')?.async('string');
  assert(slide1!.includes('<p:timing'), 'slide contains <p:timing>');
  assert(slide1!.includes('<p:cTn'), 'slide contains time node');
}

async function testErrorHandling() {
  log('TEST', '=== Error Handling ===');
  const mgr = new AnimationManager();
  let error: Error | null = null;
  try {
    await mgr.applyAnimations('/non/existent/file.pptx');
  } catch (e) {
    error = e as Error;
  }
  assert(error !== null, 'throws on non-existent file');
  assert(error!.message.includes('not found'), 'has descriptive error');
}

async function main() {
  console.log('=====================================================');
  console.log('  Animation Module Tests');
  console.log('=====================================================\n');

  await setup();

  try {
    await testFadeTransition();
    await testAllTransitionTypes();
    await testDirectionParameter();
    await testNoTransition();
    await testDefaultAnimations();
    await testShapeAnimation();
    await testErrorHandling();
  } finally {
    await cleanup();
  }

  console.log('\n=====================================================');
  console.log(`  Result: ${passed} passed, ${failed} failed`);
  console.log('=====================================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
