/**
 * DrawingML 原始 XML 注入器
 *
 * 允许用户直接注入自定义 XML 到 PPTX 中。
 * 适用于 SmartArt、复杂图表、自定义动画等高级场景。
 *
 * 使用 JSZip 后处理 .pptx 文件，修改 slide XML 后重新打包。
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import JSZip from 'jszip';

export interface InjectOptions {
  /** 目标 slide 编号（1-based），或 '*' 表示所有 */
  targetSlide?: number | 'all';
  /** 注入位置：'spTree'（形状树内）或 'cSld'（cSld 末尾） */
  position?: 'spTree' | 'cSld';
  /** 自定义命名空间声明（可选） */
  namespaces?: string[];
}

/**
 * 在指定位置注入 XML 到 .pptx 文件
 */
export async function injectXML(
  pptxPath: string,
  xml: string,
  options: InjectOptions = {}
): Promise<string> {
  if (!existsSync(pptxPath)) {
    throw new Error(`File not found: ${pptxPath}`);
  }
  const { targetSlide = 'all', position = 'spTree' } = options;
  const buf = await readFile(pptxPath);
  const zip = await JSZip.loadAsync(buf);

  // 1. 添加命名空间（如果指定）
  let processedXml = xml;
  if (options.namespaces && options.namespaces.length > 0) {
    // 注意：完整实现需要解析 root 元素并添加 xmlns
    // 简化版：假设 XML 自带命名空间
  }

  // 2. 选择目标 slide
  const slideFiles = Object.keys(zip.files)
    .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      return numA - numB;
    });

  const targets = targetSlide === 'all'
    ? slideFiles
    : [slideFiles[targetSlide - 1]].filter(Boolean);

  for (const fileName of targets) {
    const file = zip.file(fileName);
    if (!file) continue;

    let content = await file.async('string');
    if (position === 'spTree') {
      content = content.replace(/(<\/p:spTree>)/, `${processedXml}$1`);
    } else {
      content = content.replace(/(<\/p:cSld>)/, `${processedXml}$1`);
    }
    zip.file(fileName, content);
  }

  const outputBuf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  const outputPath = pptxPath.replace(/\.pptx$/, '.injected.pptx');
  await writeFile(outputPath, outputBuf);
  return outputPath;
}

/**
 * 便捷方法：注入 SmartArt XML
 */
export async function injectSmartArt(
  pptxPath: string,
  smartArtXml: string,
  slideNumber: number
): Promise<string> {
  return injectXML(pptxPath, smartArtXml, {
    targetSlide: slideNumber,
    position: 'spTree',
  });
}

/**
 * 便捷方法：向所有 slide 添加统一元素
 */
export async function injectToAllSlides(
  pptxPath: string,
  xml: string,
  position: 'spTree' | 'cSld' = 'spTree'
): Promise<string> {
  return injectXML(pptxPath, xml, { targetSlide: 'all', position });
}
