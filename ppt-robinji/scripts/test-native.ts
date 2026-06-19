#!/usr/bin/env node
/**
 * Native DrawingML 模块测试
 */

import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import PptxGenJS from 'pptxgenjs';
import {
  parseSVG,
  buildShapeXml,
  star,
  arrow,
  heart,
  ring,
  ellipsePath,
  polygonFromPoints,
  fromSVGPath,
  injectXML,
} from '../src/pptx/native/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_DIR = join(__dirname, '../.test-tmp/native');

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

async function createBasePptx(filePath: string, slideCount = 2): Promise<void> {
  const pres = new PptxGenJS();
  for (let i = 0; i < slideCount; i++) {
    const slide = pres.addSlide();
    slide.addText(`Slide ${i + 1}`, {
      x: 1, y: 2, w: 8, h: 1.5,
      fontSize: 36, color: '333333', align: 'center'
    });
  }
  await pres.writeFile({ fileName: filePath });
}

// ========== SVG Parser Tests ==========

async function testParseRect() {
  log('TEST', '=== Parse Rect ===');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect x="10" y="20" width="100" height="50" fill="#FF0000"/></svg>';
  const shapes = parseSVG(svg);
  assert(shapes.length === 1, 'parsed 1 shape');
  assert(shapes[0].prst === 'rect', `prst is rect (got ${shapes[0].prst})`);
  assert(shapes[0].fill === 'FF0000', `fill is FF0000 (got ${shapes[0].fill})`);
  assert(shapes[0].width > 0, `width > 0 (got ${shapes[0].width})`);
}

async function testParseCircle() {
  log('TEST', '=== Parse Circle ===');
  const svg = '<svg><circle cx="50" cy="50" r="40" fill="blue" stroke="black" stroke-width="2"/></svg>';
  const shapes = parseSVG(svg);
  assert(shapes.length === 1, 'parsed 1 shape');
  assert(shapes[0].prst === 'ellipse', `prst is ellipse (got ${shapes[0].prst})`);
  assert(shapes[0].fill === '0000FF', `fill is blue/0000FF (got ${shapes[0].fill})`);
  assert(shapes[0].stroke === '000000', `stroke is black/000000 (got ${shapes[0].stroke})`);
}

async function testParseEllipse() {
  log('TEST', '=== Parse Ellipse ===');
  const svg = '<svg><ellipse cx="50" cy="50" rx="30" ry="20" fill="green"/></svg>';
  const shapes = parseSVG(svg);
  assert(shapes.length === 1, 'parsed 1 shape');
  assert(shapes[0].prst === 'ellipse', 'prst is ellipse');
  // 验证尺寸：rx=30, ry=20 → width=60, height=40
  assert(shapes[0].width === Math.round(60 * 9525), `width is 60*9525 (got ${shapes[0].width})`);
  assert(shapes[0].height === Math.round(40 * 9525), `height is 40*9525 (got ${shapes[0].height})`);
}

async function testParseLine() {
  log('TEST', '=== Parse Line ===');
  const svg = '<svg><line x1="0" y1="0" x2="100" y2="100" stroke="red"/></svg>';
  const shapes = parseSVG(svg);
  assert(shapes.length === 1, 'parsed 1 shape');
  assert(shapes[0].prst === 'line', 'prst is line');
}

async function testParsePolygon() {
  log('TEST', '=== Parse Polygon ===');
  const svg = '<svg><polygon points="10,10 50,50 10,50" fill="purple"/></svg>';
  const shapes = parseSVG(svg);
  assert(shapes.length === 1, 'parsed 1 shape');
  assert(shapes[0].prst === 'custGeom', 'prst is custGeom (custom)');
  assert(shapes[0].geometryXml.includes('custGeom'), 'geometryXml contains custGeom');
  assert(shapes[0].geometryXml.includes('a:pathLst'), 'geometryXml contains pathLst');
}

async function testParsePath() {
  log('TEST', '=== Parse Path ===');
  const svg = '<svg><path d="M 0 0 L 100 0 L 100 100 Z" fill="orange"/></svg>';
  const shapes = parseSVG(svg);
  assert(shapes.length === 1, 'parsed 1 shape');
  assert(shapes[0].prst === 'custGeom', 'prst is custGeom');
}

async function testParseRoundedRect() {
  log('TEST', '=== Parse Rounded Rect ===');
  const svg = '<svg><rect x="0" y="0" width="100" height="100" rx="10" fill="cyan"/></svg>';
  const shapes = parseSVG(svg);
  assert(shapes.length === 1, 'parsed 1 shape');
  assert(shapes[0].prst === 'roundRect', `prst is roundRect (got ${shapes[0].prst})`);
}

async function testBuildShapeXml() {
  log('TEST', '=== Build Shape XML ===');
  const svg = '<svg><rect x="0" y="0" width="100" height="100" fill="red"/></svg>';
  const shapes = parseSVG(svg);
  const xml = buildShapeXml(shapes[0], 'MyRect', 100);
  assert(xml.includes('<p:sp>'), 'XML has <p:sp>');
  assert(xml.includes('name="MyRect"'), 'XML has shape name');
  assert(xml.includes('id="100"'), 'XML has shape id');
  assert(xml.includes('<a:prstGeom'), 'XML has geometry');
  assert(xml.includes('FF0000'), 'XML has fill color');
}

async function testColorNormalization() {
  log('TEST', '=== Color Normalization ===');
  // 三位 hex
  const s1 = parseSVG('<svg><rect width="10" height="10" fill="#f0a"/></svg>');
  assert(s1[0].fill === 'FF00AA', `#f0a → FF00AA (got ${s1[0].fill})`);
  // 大写
  const s2 = parseSVG('<svg><rect width="10" height="10" fill="#aabbcc"/></svg>');
  assert(s2[0].fill === 'AABBCC', `#aabbcc → AABBCC (got ${s2[0].fill})`);
  // 命名色
  const s3 = parseSVG('<svg><rect width="10" height="10" fill="red"/></svg>');
  assert(s3[0].fill === 'FF0000', `red → FF0000 (got ${s3[0].fill})`);
}

// ========== Native Shape Builder Tests ==========

async function testStarShape() {
  log('TEST', '=== Star Shape ===');
  const s = star({ outerRadius: 1, innerRadius: 0.4, points: 5 });
  assert(s.svgPath.startsWith('M'), 'has SVG path');
  assert(s.width === 2, `width is 2 (got ${s.width})`);
  assert(s.height === 2, `height is 2 (got ${s.height})`);
  assert(s.geometryXml.includes('custGeom'), 'has custom geometry');
  assert(s.geometryXml.includes('a:pathLst'), 'has path list');
}

async function testArrowShape() {
  log('TEST', '=== Arrow Shape ===');
  const s = arrow({ width: 2, height: 1, headSize: 0.4 });
  assert(s.svgPath.startsWith('M'), 'has SVG path');
  assert(s.svgPath.includes('L'), 'has line segments');
  assert(s.width === 2, 'width is 2');
  assert(s.height === 1, 'height is 1');
}

async function testHeartShape() {
  log('TEST', '=== Heart Shape ===');
  const s = heart({ width: 1, height: 1 });
  assert(s.svgPath.length > 0, 'has SVG path');
  assert(s.geometryXml.includes('custGeom'), 'has custom geometry');
}

async function testRingShape() {
  log('TEST', '=== Ring Shape ===');
  const s = ring({ outerRadius: 1, innerRadius: 0.5 });
  assert(s.svgPath.length > 0, 'has SVG path');
  assert(s.geometryXml.includes('evenOdd'), 'uses even-odd fill rule for ring');
}

async function testEllipsePath() {
  log('TEST', '=== Ellipse Path ===');
  const s = ellipsePath({ rx: 1, ry: 0.5 });
  assert(s.svgPath.includes('C'), 'has bezier curves');
  assert(s.width === 2, 'width is 2');
  assert(s.height === 1, 'height is 1');
}

async function testPolygonFromPoints() {
  log('TEST', '=== Polygon From Points ===');
  const s = polygonFromPoints(
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0.5, y: 1 },
    ],
    1, 1
  );
  // 使用 toFixed(3) 格式
  assert(s.svgPath === 'M 0.000 0.000 L 1.000 0.000 L 0.500 1.000 Z', `has correct path (got "${s.svgPath}")`);
  assert(s.geometryXml.includes('custGeom'), 'has custom geometry');
}

async function testFromSVGPath() {
  log('TEST', '=== From SVG Path ===');
  const pathStr = 'M 0 0 L 100 0 L 100 100 L 0 100 Z';
  const s = fromSVGPath(pathStr, 100, 100);
  assert(s.svgPath === pathStr, 'preserves path');
  assert(s.width === 100, 'width preserved');
  assert(s.height === 100, 'height preserved');
}

// ========== Raw XML Injector Tests ==========

async function testInjectXMLToAllSlides() {
  log('TEST', '=== Inject XML to All Slides ===');
  const file = join(TEST_DIR, 'inject-all.pptx');
  await createBasePptx(file, 3);

  const customXml = '<p:sp><p:nvSpPr><p:cNvPr id="999" name="CustomShape"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="100000" cy="100000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="FFFF00"/></a:solidFill></p:spPr></p:sp>';

  const output = await injectXML(file, customXml, { targetSlide: 'all', position: 'spTree' });

  const JSZip = (await import('jszip')).default;
  const buf = await readFile(output);
  const zip = await JSZip.loadAsync(buf);

  let foundCount = 0;
  for (let i = 1; i <= 3; i++) {
    const xml = await zip.file(`ppt/slides/slide${i}.xml`)?.async('string');
    if (xml?.includes('name="CustomShape"')) foundCount++;
  }
  assert(foundCount === 3, `CustomShape found in 3 slides (got ${foundCount})`);
}

async function testInjectXMLToOneSlide() {
  log('TEST', '=== Inject XML to Specific Slide ===');
  const file = join(TEST_DIR, 'inject-one.pptx');
  await createBasePptx(file, 3);

  const customXml = '<p:sp><p:nvSpPr><p:cNvPr id="888" name="Slide2Only"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr/></p:sp>';
  const output = await injectXML(file, customXml, { targetSlide: 2, position: 'spTree' });

  const JSZip = (await import('jszip')).default;
  const buf = await readFile(output);
  const zip = await JSZip.loadAsync(buf);

  const xml1 = await zip.file('ppt/slides/slide1.xml')?.async('string');
  const xml2 = await zip.file('ppt/slides/slide2.xml')?.async('string');
  const xml3 = await zip.file('ppt/slides/slide3.xml')?.async('string');

  assert(!xml1!.includes('Slide2Only'), 'slide1 NOT injected');
  assert(xml2!.includes('Slide2Only'), 'slide2 IS injected');
  assert(!xml3!.includes('Slide2Only'), 'slide3 NOT injected');
}

async function testInjectError() {
  log('TEST', '=== Inject Error Handling ===');
  let error: Error | null = null;
  try {
    await injectXML('/non/existent/file.pptx', '<x/>', {});
  } catch (e) {
    error = e as Error;
  }
  assert(error !== null, 'throws on non-existent file');
}

async function testIntegrationWithPptxgenjs() {
  log('TEST', '=== Integration: SVG → PPTX ===');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="200" height="100" fill="#3B82F6" rx="8"/>
      <circle cx="300" cy="50" r="40" fill="#10B981"/>
    </svg>
  `;
  const shapes = parseSVG(svg);
  assert(shapes.length === 2, 'parsed 2 shapes');

  // 创建 PPT，注入 SVG 形状
  const pres = new PptxGenJS();
  const slide = pres.addSlide();

  // 使用 buildShapeXml 生成 XML 并通过 rawXml 注入
  const JSZip = (await import('jszip')).default;
  const tempFile = join(TEST_DIR, 'svg-integration.pptx');
  await pres.writeFile({ fileName: tempFile });

  const xml1 = buildShapeXml(shapes[0], 'SvgRect', 100);
  const xml2 = buildShapeXml(shapes[1], 'SvgCircle', 101);
  const output = await injectXML(tempFile, xml1 + xml2, {
    targetSlide: 1,
    position: 'spTree',
  });

  const buf = await readFile(output);
  const zip = await JSZip.loadAsync(buf);
  const slideXml = await zip.file('ppt/slides/slide1.xml')?.async('string');

  assert(slideXml!.includes('SvgRect'), 'slide has SvgRect');
  assert(slideXml!.includes('SvgCircle'), 'slide has SvgCircle');
  assert(slideXml!.includes('3B82F6'), 'slide has blue color');
  assert(slideXml!.includes('10B981'), 'slide has green color');
}

async function main() {
  console.log('=====================================================');
  console.log('  Native DrawingML Module Tests');
  console.log('=====================================================\n');

  await setup();

  try {
    // SVG Parser tests
    await testParseRect();
    await testParseCircle();
    await testParseEllipse();
    await testParseLine();
    await testParsePolygon();
    await testParsePath();
    await testParseRoundedRect();
    await testBuildShapeXml();
    await testColorNormalization();

    // Native Shape tests
    await testStarShape();
    await testArrowShape();
    await testHeartShape();
    await testRingShape();
    await testEllipsePath();
    await testPolygonFromPoints();
    await testFromSVGPath();

    // Raw XML Injector tests
    await testInjectXMLToAllSlides();
    await testInjectXMLToOneSlide();
    await testInjectError();
    await testIntegrationWithPptxgenjs();
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
