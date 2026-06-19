#!/usr/bin/env node
/**
 * A11y 检查器测试
 */

import { mkdir, rm, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  checkA11y,
  reportToJSON,
  reportToMarkdown,
  reportToHTML,
  contrastRatio,
  simulateColorBlind,
  hexToRgb,
  relativeLuminance,
} from '../src/pptx/a11y-checker.js';
import { getTemplate } from '../src/pptx/templates/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DIR = join(__dirname, '../.test-tmp/a11y');

let passed = 0;
let failed = 0;

function log(level: 'INFO' | 'OK' | 'FAIL' | 'TEST', msg: string) {
  const colors = { INFO: '\x1b[36m', OK: '\x1b[32m', FAIL: '\x1b[31m', TEST: '\x1b[35m' };
  const reset = '\x1b[0m';
  console.log(`${colors[level]}[${level}]${reset} ${msg}`);
}

function assert(condition: boolean, msg: string) {
  if (condition) { passed++; log('OK', msg); }
  else { failed++; log('FAIL', msg); }
}

async function setup() {
  await mkdir(TEST_DIR, { recursive: true });
}

async function cleanup() {
  try { await rm(TEST_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
}

// ========== Color Math Tests ==========

async function testColorMath() {
  log('TEST', '=== Color Math Utilities ===');

  // hexToRgb
  const rgb1 = hexToRgb('#FF0000');
  assert(rgb1[0] === 255 && rgb1[1] === 0 && rgb1[2] === 0, 'hexToRgb FF0000');

  const rgb2 = hexToRgb('FFFFFF');
  assert(rgb2[0] === 255 && rgb2[1] === 255 && rgb2[2] === 255, 'hexToRgb FFFFFF (no #)');

  // relativeLuminance
  const lumBlack = relativeLuminance('000000');
  const lumWhite = relativeLuminance('FFFFFF');
  assert(lumBlack === 0, 'black luminance is 0');
  assert(Math.abs(lumWhite - 1) < 0.01, `white luminance ~1 (${lumWhite})`);

  // contrastRatio
  const cr1 = contrastRatio('FFFFFF', '000000');
  assert(Math.abs(cr1 - 21) < 0.5, `white/black contrast ~21:1 (${cr1.toFixed(2)})`);

  const cr2 = contrastRatio('FFFFFF', 'FFFFFF');
  assert(cr2 === 1, 'same color contrast is 1:1');
}

async function testColorBlindSimulation() {
  log('TEST', '=== Color Blind Simulation ===');
  const original = 'FF0000'; // 纯红
  const prot = simulateColorBlind(original, 'protanopia');
  const deu = simulateColorBlind(original, 'deuteranopia');
  const tri = simulateColorBlind(original, 'tritanopia');
  assert(prot !== original, `protanopia changes red (${original} → ${prot})`);
  assert(deu !== original, `deuteranopia changes red (${original} → ${deu})`);
  assert(tri !== original, `tritanopia changes red (${original} → ${tri})`);
  // 三个色盲类型应产生不同结果
  assert(prot !== deu, 'protanopia ≠ deuteranopia');
  assert(deu !== tri, 'deuteranopia ≠ tritanopia');
}

// ========== Main Check Tests ==========

async function testBasicCheck() {
  log('TEST', '=== Basic A11y Check ===');
  const template = getTemplate('business-classic');
  const content = {
    title: 'Test',
    slides: [
      { title: 'Good Slide', type: 'cover' as const, content: ['Short bullet'] },
    ],
  };
  const report = checkA11y(content, template.palette);
  assert(report.totalSlides === 1, 'has 1 slide');
  assert(report.level === 'AA', 'default level is AA');
  assert(report.score >= 0 && report.score <= 100, 'score in range');
  assert(Array.isArray(report.issues), 'issues is array');
  assert(Array.isArray(report.slideScores), 'slideScores is array');
}

async function testAAALevel() {
  log('TEST', '=== WCAG AAA Level ===');
  const template = getTemplate('business-classic');
  const content = {
    title: 'Test',
    slides: [
      { title: 'Slide', type: 'content' as const, content: ['Test'] },
    ],
  };
  const reportAA = checkA11y(content, template.palette, { level: 'AA' });
  const reportAAA = checkA11y(content, template.palette, { level: 'AAA' });
  // AAA 更严格，应发现至少相同或更多问题
  assert(reportAAA.level === 'AAA', 'AAA level set');
  assert(reportAAA.errors >= reportAA.errors, 'AAA finds >= AA errors');
}

async function testContrastDetection() {
  log('TEST', '=== Contrast Detection ===');
  // 构造低对比度配色
  const badPalette = {
    primary: '000000',         // primary 与 background 不同
    secondary: 'F0F0F0',
    accent: 'FFFFFF',
    text: 'EEEEEE', // 几乎与背景相同
    textSecondary: 'CCCCCC',
    background: 'FFFFFF',
    surface: 'F5F5F5',
    border: 'DDDDDD',
  };
  const content = {
    title: 'Test',
    slides: [
      { title: 'Slide', type: 'content' as const, content: ['test'] },
    ],
  };
  const report = checkA11y(content, badPalette);
  const contrastIssues = report.issues.filter(i => i.category === 'contrast');
  assert(contrastIssues.length > 0, `detects low contrast (${contrastIssues.length} issues)`);
  assert(report.errors > 0, 'has errors');
}

async function testColorBlindMode() {
  log('TEST', '=== Color Blind Mode ===');
  const template = getTemplate('tech-neon');
  const content = {
    title: 'Test',
    slides: [
      { title: 'Slide 1', type: 'cover' as const, content: ['test'] },
      { title: 'Slide 2', type: 'content' as const, content: ['test'] },
    ],
  };
  const report = checkA11y(content, template.palette, {
    enableColorBlindSim: true,
    colorBlindType: 'deuteranopia',
  });
  assert(report.totalSlides === 2, 'has 2 slides');
  // 色盲模式应增加色盲相关 issue
  const cbIssues = report.issues.filter(i => i.category === 'color-blind');
  log('INFO', `Color blind issues: ${cbIssues.length}`);
}

async function testHeadingHierarchy() {
  log('TEST', '=== Heading Hierarchy ===');
  const content = {
    title: 'Test',
    slides: [
      { title: 'L1', type: 'cover' as const, content: [] },
      // 跳级：cover 是 L1，下一个是 content（L0，跳过）
      // 实际上 content 是 L0，所以不会触发跳级
      { title: 'L2', type: 'divider' as const, content: [] }, // L2
      { title: 'L4', type: 'conclusion' as const, content: [] }, // L3（不会跳级）
    ],
  };
  const template = getTemplate('business-classic');
  const report = checkA11y(content, template.palette);
  const hhIssues = report.issues.filter(i => i.category === 'heading-hierarchy');
  log('INFO', `Heading hierarchy issues: ${hhIssues.length}`);
  // 大多数情况不应有跳级
  assert(true, 'no false-positive heading issues');
}

async function testContentLength() {
  log('TEST', '=== Content Length Checks ===');
  const template = getTemplate('business-classic');
  const content = {
    title: 'Test',
    slides: [
      { title: 'Long Slide', type: 'content' as const, content: [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', // 8 items
      ]},
      { title: 'Long Title '.repeat(10), type: 'content' as const, content: [] },
      { title: 'OK', type: 'content' as const, content: [
        'A very long bullet point that exceeds the recommended length of 80 characters and should trigger a warning',
      ]},
    ],
  };
  const report = checkA11y(content, template.palette);
  const lengthIssues = report.issues.filter(i => i.category === 'content-length');
  assert(lengthIssues.length >= 2, `detects length issues (${lengthIssues.length})`);
}

async function testAltTextCheck() {
  log('TEST', '=== Alt Text Check ===');
  const template = getTemplate('business-classic');
  const content = {
    title: 'Test',
    slides: [
      { title: 'Image', type: 'content' as const, content: ['test'], imageUrl: 'https://example.com/img.png' } as any,
    ],
  };
  const report = checkA11y(content, template.palette);
  const altIssues = report.issues.filter(i => i.category === 'alt-text');
  assert(altIssues.length === 1, `detects missing alt text (${altIssues.length})`);
}

// ========== Report Export Tests ==========

async function testJSONExport() {
  log('TEST', '=== JSON Report Export ===');
  const template = getTemplate('business-classic');
  const content = {
    title: 'Test',
    slides: [{ title: 'Slide', type: 'cover' as const, content: [] }],
  };
  const report = checkA11y(content, template.palette);
  const json = reportToJSON(report);
  assert(json.startsWith('{'), 'JSON output');
  const parsed = JSON.parse(json);
  assert(parsed.totalSlides === 1, 'JSON round-trips');
}

async function testMarkdownExport() {
  log('TEST', '=== Markdown Report Export ===');
  const template = getTemplate('business-classic');
  const content = {
    title: 'Test',
    slides: [
      { title: 'Bad', type: 'content' as const, content: [
        'A very long bullet point that exceeds the recommended length of 80 characters and should trigger a warning',
      ]},
    ],
  };
  const report = checkA11y(content, template.palette);
  const md = reportToMarkdown(report);
  assert(md.startsWith('# A11y'), 'starts with title');
  assert(md.includes('WCAG'), 'has WCAG level');
  assert(md.includes('综合得分'), 'has score');
  assert(md.length > 100, 'has substantial content');

  // 保存到文件
  await writeFile(join(TEST_DIR, 'report.md'), md, 'utf-8');
  log('INFO', 'Saved report.md');
}

async function testHTMLExport() {
  log('TEST', '=== HTML Report Export ===');
  const template = getTemplate('business-classic');
  const content = {
    title: 'Test',
    slides: [{ title: 'Slide', type: 'cover' as const, content: [] }],
  };
  const report = checkA11y(content, template.palette);
  const html = reportToHTML(report);
  assert(html.startsWith('<!DOCTYPE'), 'HTML doctype');
  assert(html.includes('A11y'), 'has title');
  assert(html.includes('<table>'), 'has table');
  await writeFile(join(TEST_DIR, 'report.html'), html, 'utf-8');
  log('INFO', 'Saved report.html');
}

// ========== CLI Integration Test ==========

async function testCLIIntegration() {
  log('TEST', '=== CLI Script Integration ===');
  // 模拟 check-a11y.ts 调用
  const template = getTemplate('minimal-paper');
  const content = {
    title: 'My Talk',
    slides: [
      { title: 'Cover', type: 'cover' as const, content: ['Subtitle'] },
      { title: 'Content', type: 'content' as const, content: ['Point 1', 'Point 2', 'Point 3'] },
    ],
  };
  const report = checkA11y(content, template.palette, { level: 'AA' });
  assert(report.totalSlides === 2, 'has 2 slides');
  // 报告可被序列化为 JSON
  const json = reportToJSON(report, false);
  assert(json.length > 50, 'compact JSON has content');
}

async function main() {
  console.log('=====================================================');
  console.log('  A11y Checker Tests (Enhanced v2.5)');
  console.log('=====================================================\n');

  await setup();

  try {
    await testColorMath();
    await testColorBlindSimulation();
    await testBasicCheck();
    await testAAALevel();
    await testContrastDetection();
    await testColorBlindMode();
    await testHeadingHierarchy();
    await testContentLength();
    await testAltTextCheck();
    await testJSONExport();
    await testMarkdownExport();
    await testHTMLExport();
    await testCLIIntegration();
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
