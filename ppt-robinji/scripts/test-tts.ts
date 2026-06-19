#!/usr/bin/env node
/**
 * TTS 音频模块测试
 */

import { writeFile, mkdir, rm, readFile, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import PptxGenJS from 'pptxgenjs';
import {
  TTSManager,
  EdgeTTSProvider,
  OpenAITTSProvider,
  OfflineTTSProvider,
  MockTTSProvider,
  embedAudio,
} from '../src/audio/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DIR = join(__dirname, '../.test-tmp/tts');

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

// ========== Provider Tests ==========

async function testMockTTS() {
  log('TEST', '=== Mock TTS ===');
  const p = new MockTTSProvider();
  assert(await p.isAvailable() === true, 'mock is always available');
  const voices = await p.listVoices();
  assert(voices.length > 0, `mock has voices (${voices.length})`);

  const out = join(TEST_DIR, 'mock.wav');
  const result = await p.synthesize({
    text: 'Hello world',
    voice: 'mock-en',
    outputPath: out,
  });
  assert(result === out, 'synthesize returns output path');
  const st = await stat(out);
  assert(st.size > 44, `output file has content (${st.size} bytes)`);
  assert(out.endsWith('.wav'), 'output is WAV');
}

async function testEdgeTTS() {
  log('TEST', '=== Edge TTS Provider ===');
  const p = new EdgeTTSProvider();
  const voices = await p.listVoices();
  assert(voices.length > 0, `edge has voices (${voices.length})`);
  // 验证有中文和英文
  const hasChinese = voices.some(v => v.language.startsWith('zh'));
  const hasEnglish = voices.some(v => v.language.startsWith('en'));
  assert(hasChinese, 'has Chinese voices');
  assert(hasEnglish, 'has English voices');

  // 验证常用中文语音
  const xiaoxiao = voices.find(v => v.id === 'zh-CN-XiaoxiaoNeural');
  assert(xiaoxiao !== undefined, 'has Xiaoxiao voice');
}

async function testOpenAITTS() {
  log('TEST', '=== OpenAI TTS Provider ===');
  const p = new OpenAITTSProvider();
  const voices = await p.listVoices();
  assert(voices.length === 6, `openai has 6 voices (got ${voices.length})`);
  assert(voices.some(v => v.id === 'alloy'), 'has alloy voice');
  assert(voices.some(v => v.id === 'nova'), 'has nova voice');
}

async function testOfflineTTS() {
  log('TEST', '=== Offline TTS Provider ===');
  const p = new OfflineTTSProvider();
  // 在 macOS 上应该可用
  if (process.platform === 'darwin') {
    const available = await p.isAvailable();
    assert(available === true, 'offline TTS available on macOS');
  } else {
    log('INFO', `(skipping offline test on ${process.platform})`);
  }
}

// ========== Manager Tests ==========

async function testManagerBestProvider() {
  log('TEST', '=== TTS Manager ===');
  const mgr = new TTSManager();
  const best = await mgr.getBestProvider();
  assert(best !== null, 'got a best provider');

  const available = await mgr.listAvailable();
  assert(available.length > 0, `at least one provider available (${available.length})`);
  log('INFO', `Best provider: ${best.name}`);
  log('INFO', `Available: ${available.map(p => p.name).join(', ')}`);
}

async function testManagerGetByName() {
  log('TEST', '=== Manager Get Provider By Name ===');
  const mgr = new TTSManager();
  const mock = await mgr.getProvider('mock');
  assert(mock !== undefined, 'got mock provider');
  assert(mock!.name === 'mock', 'is mock');
}

async function testManagerBatchSynthesis() {
  log('TEST', '=== Manager Batch Synthesis ===');
  const mgr = new TTSManager();
  const outputDir = join(TEST_DIR, 'batch');
  const paths = await mgr.generateSpeakerAudio(
    [
      { script: 'Hello world' },
      { script: 'Second slide' },
      { script: '' }, // 空文本应跳过
      { script: 'Last slide' },
    ],
    outputDir,
    { provider: 'mock' }
  );
  assert(paths.length === 4, 'returns 4 paths');
  assert(paths[0] !== '', 'first has path');
  assert(paths[1] !== '', 'second has path');
  assert(paths[2] === '', 'empty script skipped');
  assert(paths[3] !== '', 'fourth has path');
}

// ========== Embedder Tests ==========

async function createBasePptx(filePath: string): Promise<void> {
  const pres = new PptxGenJS();
  const slide = pres.addSlide();
  slide.addText('Test', { x: 1, y: 1, w: 8, h: 1 });
  slide.addNotes('Speaker notes for slide 1');
  await pres.writeFile({ fileName: filePath });
}

async function testEmbedAudio() {
  log('TEST', '=== Embed Audio to PPTX ===');
  const pres = new PptxGenJS();
  const slide = pres.addSlide();
  slide.addText('Slide 1', { x: 1, y: 1, w: 8, h: 1 });
  slide.addNotes('Hello world');
  const slide2 = pres.addSlide();
  slide2.addText('Slide 2', { x: 1, y: 1, w: 8, h: 1 });
  const basePath = join(TEST_DIR, 'embed-base.pptx');
  await pres.writeFile({ fileName: basePath });

  // 先生成 mock 音频
  const mock = new MockTTSProvider();
  const audio1 = join(TEST_DIR, 'audio1.wav');
  const audio2 = join(TEST_DIR, 'audio2.wav');
  await mock.synthesize({ text: 'Slide 1', voice: 'mock-en', outputPath: audio1 });
  await mock.synthesize({ text: 'Slide 2', voice: 'mock-en', outputPath: audio2 });

  // 嵌入
  const output = await embedAudio(basePath, [
    { filePath: audio1, slideNumber: 1, name: 'Slide 1 Audio' },
    { filePath: audio2, slideNumber: 2, name: 'Slide 2 Audio' },
  ], { trigger: 'auto' });

  const JSZip = (await import('jszip')).default;
  const buf = await readFile(output);
  const zip = await JSZip.loadAsync(buf);

  // 验证音频文件被添加
  const mediaFiles = Object.keys(zip.files).filter(f => /^ppt\/media\//.test(f));
  assert(mediaFiles.length >= 2, `media files added (${mediaFiles.length})`);

  // 验证 Content_Types.xml
  const ct = await zip.file('[Content_Types].xml')?.async('string');
  assert(ct!.includes('audio') || ct!.includes('wav'), 'Content_Types has audio type');
}

async function testEmbedError() {
  log('TEST', '=== Embed Error Handling ===');
  let error: Error | null = null;
  try {
    await embedAudio('/non/existent/file.pptx', []);
  } catch (e) {
    error = e as Error;
  }
  assert(error !== null, 'throws on non-existent file');
}

async function testVoiceListing() {
  log('TEST', '=== Voice Listing Across Providers ===');
  const mgr = new TTSManager();
  for (const provider of await mgr.listAvailable()) {
    const voices = await provider.listVoices();
    log('INFO', `${provider.name}: ${voices.length} voices`);
    assert(voices.length > 0, `${provider.name} has voices`);
  }
}

async function main() {
  console.log('=====================================================');
  console.log('  TTS Audio Module Tests');
  console.log('=====================================================\n');

  await setup();

  try {
    await testMockTTS();
    await testEdgeTTS();
    await testOpenAITTS();
    await testOfflineTTS();
    await testManagerBestProvider();
    await testManagerGetByName();
    await testManagerBatchSynthesis();
    await testEmbedAudio();
    await testEmbedError();
    await testVoiceListing();
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
