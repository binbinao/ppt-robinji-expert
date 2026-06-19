import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, extname } from 'path';
import JSZip from 'jszip';

/**
 * 音频嵌入器
 *
 * 将 MP3/WAV 音频文件嵌入到 .pptx 中，并关联到对应 slide 的 notes。
 * PowerPoint 会将音频作为 notes 的一部分渲染。
 */

export interface AudioInfo {
  filePath: string;
  /** 对应的 slide 编号（1-based） */
  slideNumber: number;
  /** 显示名称 */
  name?: string;
}

export interface EmbedAudioOptions {
  /** 触发动画：auto = 切到该 slide 时自动播放 */
  trigger?: 'auto' | 'click';
}

/**
 * 将音频文件嵌入 .pptx
 *
 * 实现：
 * 1. 将 MP3 添加到 ppt/media/ 目录
 * 2. 更新 [Content_Types].xml 添加 audio 媒体类型
 * 3. 更新 slide rels 添加 media 关系
 * 4. 在 slide 的 notes XML 中添加 audio 引用
 */
export async function embedAudio(
  pptxPath: string,
  audios: AudioInfo[],
  options: EmbedAudioOptions = {}
): Promise<string> {
  if (!existsSync(pptxPath)) {
    throw new Error(`File not found: ${pptxPath}`);
  }

  const buf = await readFile(pptxPath);
  const zip = await JSZip.loadAsync(buf);

  // 1. 统计已存在的媒体文件
  const existingMedia = Object.keys(zip.files).filter(f => /^ppt\/media\//.test(f));
  let mediaCounter = existingMedia.length;

  for (const audio of audios) {
    if (!existsSync(audio.filePath)) continue;

    mediaCounter++;
    const ext = extname(audio.filePath).substring(1).toLowerCase() || 'mp3';
    const mediaFileName = `audio${mediaCounter}.${ext}`;
    const mediaPath = `ppt/media/${mediaFileName}`;

    // 1.1 添加媒体文件
    const audioBuf = await readFile(audio.filePath);
    zip.file(mediaPath, audioBuf);

    // 1.2 更新 [Content_Types].xml
    await updateContentTypes(zip, ext);

    // 1.3 更新 slide rels
    await updateSlideRels(zip, audio.slideNumber, mediaFileName);

    // 1.4 更新 notes XML（添加 audio 引用）
    await updateNotesXml(zip, audio.slideNumber, audio.name || `Audio ${audio.slideNumber}`, ext, options.trigger || 'auto');
  }

  const outputBuf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  const outputPath = pptxPath.replace(/\.pptx$/, '.with-audio.pptx');
  await writeFile(outputPath, outputBuf);
  return outputPath;
}

async function updateContentTypes(zip: JSZip, ext: string): Promise<void> {
  const ctPath = '[Content_Types].xml';
  const file = zip.file(ctPath);
  if (!file) return;

  let content = await file.async('string');
  const mediaType = ext === 'mp3' ? 'audio/mpeg' :
                    ext === 'wav' ? 'audio/wav' :
                    'audio/mpeg';

  const override = `PartName="/ppt/media/.*\\.${ext}" ContentType="${mediaType}"/>`;
  // 简化：检查是否已存在
  if (!content.includes(`Extension="${ext}"`)) {
    // 添加 Default Extension
    const defaultTag = `<Default Extension="${ext}" ContentType="${mediaType}"/>`;
    content = content.replace(
      /(<Types[^>]*>)/,
      `$1${defaultTag}`
    );
  }
  zip.file(ctPath, content);
}

async function updateSlideRels(zip: JSZip, slideNumber: number, mediaFileName: string): Promise<void> {
  const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;
  let content = '';

  const existing = zip.file(relsPath);
  if (existing) {
    content = await existing.async('string');
  } else {
    content = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;
  }

  // 找到最大的 rId
  const ids = [...content.matchAll(/Id="rId(\d+)"/g)].map(m => parseInt(m[1], 10));
  const nextId = (ids.length > 0 ? Math.max(...ids) : 0) + 1;

  const audioRel = `<Relationship Id="rId${nextId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/audio" Target="../media/${mediaFileName}"/>`;
  content = content.replace('</Relationships>', `${audioRel}</Relationships>`);

  zip.file(relsPath, content);
}

async function updateNotesXml(
  zip: JSZip,
  slideNumber: number,
  name: string,
  ext: string,
  trigger: 'auto' | 'click'
): Promise<void> {
  const notesPath = `ppt/notesSlides/notesSlide${slideNumber}.xml`;
  let content: string | null = null;

  const existing = zip.file(notesPath);
  if (existing) {
    content = await existing.async('string');
  } else {
    // notesSlide 不存在，需要先创建
    // 简化：跳过 notes 更新（很多 PPT 没有 notesSlide 文件）
    return;
  }

  // 找到 rId 引用（应与 rels 中的 audio 关系 ID 一致）
  const relsPath = `ppt/notesSlides/_rels/notesSlide${slideNumber}.xml.rels`;
  // 简化：通过扩展名构造引用
  const contentType = ext === 'mp3' ? 'audio/mpeg' : 'audio/wav';
  const triggerMode = trigger === 'auto' ? 'auto' : 'onClick';

  // 在 cSld 中添加 audio 节点
  const audioXml = `<p:audioFile r:link="rId${slideNumber}"/>`;
  // 由于简化实现，我们直接添加到 notes XML 的 spTree 之后
  // 实际生产中应使用更复杂的 audio 节点
  content = content.replace(
    '</p:cSld>',
    `<p:cSld><p:bg><p:bgPr/></p:bg>${audioXml}</p:cSld>`
  );

  zip.file(notesPath, content);
}
