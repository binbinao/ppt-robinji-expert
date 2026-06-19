#!/usr/bin/env node
/**
 * Source 解析器测试
 * 不依赖 AI key，可直接运行
 */

import { writeFile, mkdir, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  SourceParserFactory,
  MarkdownParser,
  TextParser,
  parseSourceFile,
  canParseSourceFile,
} from '../src/source/index.js';
import {
  sourceToPromptText,
  extractKeyPoints,
  estimateSlideCount,
} from '../src/source/to-prompt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DIR = join(__dirname, '../.test-tmp/source');

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

async function testMarkdownParser() {
  log('TEST', '=== Markdown Parser ===');
  const file = join(TEST_DIR, 'sample.md');
  const content = `# AI in Education

This is the introduction about AI transforming education.

## Background

AI has been increasingly adopted in classrooms around the world.

### Statistics

- 80% of teachers use AI tools
- 60% improvement in student outcomes

## Solutions

1. Personalized learning paths
2. Automated grading
3. Virtual tutors
`;
  await writeFile(file, content, 'utf-8');

  const parser = new MarkdownParser();
  const result = await parser.parse(file);

  assert(result.sourceType === 'markdown', 'sourceType is markdown');
  assert(result.title === 'AI in Education', `title is "AI in Education" (got "${result.title}")`);
  assert(result.text.includes('AI in Education'), 'text includes title');
  assert(Array.isArray(result.sections), 'sections is array');
  assert(result.sections!.length >= 3, `has at least 3 sections (got ${result.sections!.length})`);
  assert(result.sections![0].heading === 'AI in Education', 'first section is H1');
  assert(result.sections![0].level === 1, 'first section level is 1');
  assert(result.sections![1].level === 2, 'second section level is 2');
  assert(result.sections![2].level === 3, 'third section level is 3');
}

async function testTextParser() {
  log('TEST', '=== Text Parser ===');
  const file = join(TEST_DIR, 'sample.txt');
  const content = `The Future of AI

This is a short article about the future of AI in various industries.

It will change how we work, learn, and live.

The impact will be profound.
`;
  await writeFile(file, content, 'utf-8');

  const parser = new TextParser();
  const result = await parser.parse(file);

  assert(result.sourceType === 'text', 'sourceType is text');
  assert(result.title === 'The Future of AI', `title extracted from first line (got "${result.title}")`);
  assert(result.text.length > 50, 'text has content');
  assert(result.sections!.length >= 1, 'has at least 1 section');
}

async function testFactory() {
  log('TEST', '=== Source Parser Factory ===');
  assert(canParseSourceFile('test.pdf') === true, 'can detect .pdf');
  assert(canParseSourceFile('test.docx') === true, 'can detect .docx');
  assert(canParseSourceFile('test.md') === true, 'can detect .md');
  assert(canParseSourceFile('test.markdown') === true, 'can detect .markdown');
  assert(canParseSourceFile('test.txt') === true, 'can detect .txt');
  assert(canParseSourceFile('test.xlsx') === false, 'cannot detect .xlsx');
  assert(canParseSourceFile('test.html') === false, 'cannot detect .html');
}

async function testToPrompt() {
  log('TEST', '=== Source to Prompt Conversion ===');
  const mdFile = join(TEST_DIR, 'prompt-test.md');
  await writeFile(
    mdFile,
    `# Test Title\n\n## Section A\n\nContent of section A.\n\n## Section B\n\nContent of section B.\n`,
    'utf-8'
  );

  const source = await parseSourceFile(mdFile);
  const prompt = sourceToPromptText(source);

  assert(prompt.includes('Source Document: Test Title'), 'prompt has title');
  assert(prompt.includes('Type: markdown'), 'prompt has type');
  assert(prompt.includes('## Section A'), 'prompt has Section A');
  assert(prompt.includes('## Section B'), 'prompt has Section B');

  const keyPoints = extractKeyPoints(source, 5);
  assert(keyPoints.length > 0, `key points extracted (${keyPoints.length})`);

  const slides = estimateSlideCount(source);
  assert(slides >= 3 && slides <= 20, `slide count is reasonable (${slides})`);
}

async function testInvalidFile() {
  log('TEST', '=== Invalid File Handling ===');
  let error: Error | null = null;
  try {
    await parseSourceFile('nonexistent.pdf');
  } catch (e) {
    error = e as Error;
  }
  assert(error !== null, 'throws on non-existent file');

  let error2: Error | null = null;
  try {
    await parseSourceFile('test.unknown');
  } catch (e) {
    error2 = e as Error;
  }
  assert(error2 !== null, 'throws on unsupported extension');
}

async function testTruncation() {
  log('TEST', '=== Truncation ===');
  const file = join(TEST_DIR, 'long.md');
  const longContent = '# Long Doc\n\n' + 'A'.repeat(300000);
  await writeFile(file, longContent, 'utf-8');

  const result = await parseSourceFile(file, { maxLength: 1000 });
  assert(result.text.length <= 1100, 'text was truncated');
  assert(result.text.includes('[Truncated]'), 'truncation marker present');
}

async function main() {
  console.log('=====================================================');
  console.log('  Source Parser Tests');
  console.log('=====================================================\n');

  await setup();

  try {
    await testMarkdownParser();
    await testTextParser();
    await testFactory();
    await testToPrompt();
    await testInvalidFile();
    await testTruncation();
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
