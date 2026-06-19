import { readFile, writeFile, copyFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { dirname, basename, join } from 'path';
import JSZip from 'jszip';
import type {
  TransitionType,
  TransitionOptions,
  ShapeAnimation,
  ShapeAnimationType,
  SlideAnimationConfig,
  PresentationAnimationConfig,
} from './types.js';

/**
 * 动画管理器
 *
 * 工作原理：
 * 1. PptxGenJS 生成基础 .pptx 文件
 * 2. 我们读取 .pptx，解压 ZIP
 * 3. 修改 ppt/slides/slideN.xml 文件，注入 <p:transition> 和 <p:timing>
 * 4. 重新打包为 .pptx
 *
 * 这样做的好处：
 * - 不需要修改 pptxgenjs 内部
 * - 完全兼容 PowerPoint OOXML 规范
 * - 支持所有 PowerPoint 动画效果
 */
export class AnimationManager {
  private defaultConfig: Required<PresentationAnimationConfig> = {
    defaultTransition: { type: 'fade', duration: 700 },
    autoTransitionTypes: ['cover', 'agenda', 'divider', 'conclusion', 'cta', 'qa', 'thank-you'],
    enableShapeAnimations: false,
  };

  /**
   * 为已生成的 .pptx 文件应用动画
   *
   * @param pptxPath 原 .pptx 文件路径
   * @param slideConfigs 每张幻灯片的动画配置（可选）
   * @param globalConfig 全局配置
   * @returns 输出文件路径
   */
  async applyAnimations(
    pptxPath: string,
    slideConfigs: SlideAnimationConfig[] = [],
    globalConfig: PresentationAnimationConfig = {}
  ): Promise<string> {
    if (!existsSync(pptxPath)) {
      throw new Error(`File not found: ${pptxPath}`);
    }

    const config = { ...this.defaultConfig, ...globalConfig };
    const buf = await readFile(pptxPath);
    const zip = await JSZip.loadAsync(buf);

    // 1. 获取所有 slide 文件
    const slideFiles = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
        return numA - numB;
      });

    if (slideFiles.length === 0) {
      throw new Error('No slides found in .pptx');
    }

    // 2. 对每个 slide 文件应用动画
    for (let i = 0; i < slideFiles.length; i++) {
      const fileName = slideFiles[i];
      const slideIndex = i; // 0-based
      const file = zip.file(fileName);
      if (!file) continue;

      const xml = await file.async('string');
      const slideConfig = slideConfigs[slideIndex] || {};
      const modifiedXml = this.modifySlideXml(xml, slideConfig, config, slideIndex);
      zip.file(fileName, modifiedXml);
    }

    // 3. 重新打包
    const outputBuf = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const outputPath = pptxPath.replace(/\.pptx$/, '.animated.pptx');
    await writeFile(outputPath, outputBuf);
    return outputPath;
  }

  /**
   * 修改单个 slide 的 XML，注入 transition 和 timing
   */
  private modifySlideXml(
    xml: string,
    slideConfig: SlideAnimationConfig,
    globalConfig: Required<PresentationAnimationConfig>,
    slideIndex: number
  ): string {
    let result = xml;

    // 1. 处理 transition
    // 优先级：slideConfig.transition > autoTransitionTypes 匹配 + defaultTransition
    let transition: TransitionOptions | undefined = slideConfig.transition;
    if (!transition && globalConfig.defaultTransition) {
      // 仅当 slide type 在 autoTransitionTypes 中时才应用默认过渡
      if (slideConfig.slideType && globalConfig.autoTransitionTypes.includes(slideConfig.slideType)) {
        transition = globalConfig.defaultTransition;
      }
    }
    if (transition && transition.type !== 'none') {
      const transitionXml = this.buildTransitionXml(transition);
      // 插入到 </p:spTree> 之后，</p:cSld> 之前
      result = result.replace(
        /<\/p:spTree>/,
        `</p:spTree>${transitionXml}`
      );
    }

    // 2. 处理 shape animations
    const shapeAnims = slideConfig.shapeAnimations || [];
    if (globalConfig.enableShapeAnimations && shapeAnims.length > 0) {
      const timingXml = this.buildTimingXml(shapeAnims, result);
      // 插入到 </p:cSld> 之前
      result = result.replace(
        /<\/p:cSld>/,
        `${timingXml}</p:cSld>`
      );
    }

    return result;
  }

  /**
   * 构建 <p:transition> XML
   */
  private buildTransitionXml(transition: TransitionOptions): string {
    const type = transition.type;
    const dur = transition.duration || 700;
    const dir = transition.direction;

    // 基础 transition XML
    let xml = `<p:transition spd="${this.durationToSpeed(dur)}"`;
    if (dir) xml += ` dir="${dir}"`;
    xml += '>';

    // 不同类型的 transition 有不同的子元素
    switch (type) {
      case 'fade':
        xml += '<p:fade/>';
        break;
      case 'push':
        xml += '<p:push/>';
        break;
      case 'wipe':
        xml += '<p:wipe/>';
        break;
      case 'cover':
        xml += '<p:cover/>';
        break;
      case 'cut':
        xml += '<p:cut/>';
        break;
      case 'split':
        xml += dir ? `<p:split dir="${dir}"/>` : '<p:split orient="horz"/>';
        break;
      case 'reveal':
        xml += dir ? `<p:reveal dir="${dir}"/>` : '<p:reveal/>';
        break;
      case 'circle':
        xml += '<p:circle/>';
        break;
      case 'diamond':
        xml += '<p:diamond/>';
        break;
      case 'plus':
        xml += '<p:plus/>';
        break;
      case 'wedge':
        xml += '<p:wedge/>';
        break;
      case 'zoom':
        xml += '<p:zoom/>';
        break;
      case 'honeycomb':
        xml += '<p:honeycomb/>';
        break;
      case 'flash':
        xml += '<p:flash/>';
        break;
      case 'vortex':
        xml += '<p:vortex/>';
        break;
      case 'ripple':
        xml += '<p:ripple/>';
        break;
      case 'glitter':
        xml += '<p:glitter/>';
        break;
      case 'newsflash':
        xml += '<p:newsflash/>';
        break;
      case 'fall':
        xml += '<p:fall/>';
        break;
      case 'drape':
        xml += '<p:drape/>';
        break;
      case 'curtains':
        xml += '<p:curtains/>';
        break;
      case 'wind':
        xml += '<p:wind/>';
        break;
      case 'prestige':
        xml += '<p:prestige/>';
        break;
      case 'fracture':
        xml += '<p:fracture/>';
        break;
      case 'crush':
        xml += '<p:crush/>';
        break;
      case 'peeloff':
        xml += '<p:peeloff/>';
        break;
      case 'pageturn':
        xml += '<p:pageturn/>';
        break;
      case 'pan':
        xml += '<p:pan/>';
        break;
      case 'random':
        // Random uses randomBar
        xml += '<p:randomBar dir="l"/>';
        break;
      default:
        xml += '<p:fade/>';
    }

    xml += '</p:transition>';
    return xml;
  }

  /**
   * 构建 <p:timing> XML（shape animations）
   */
  private buildTimingXml(animations: ShapeAnimation[], slideXml: string): string {
    const shapeIds = this.extractShapeIds(slideXml);
    if (shapeIds.length === 0) return '';

    let xml = '<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"/></p:par></p:tnLst>';

    // 构建并行执行组（一次播放多个）
    const animBlocks: string[] = [];
    let timeNodeId = 2;

    animations.forEach((anim, idx) => {
      const shapeId = shapeIds[idx] || (100 + idx);
      const animId = timeNodeId++;
      const nextId = timeNodeId++;

      const delay = anim.delay || 0;
      const dur = anim.duration || 500;
      const trigger = anim.trigger === 'click' ? 'click' : 'auto';

      const animXml = this.buildShapeAnimXml(anim, shapeId, animId, nextId, delay, dur);
      animBlocks.push(animXml);
    });

    // 使用 click 时需要 parallel timeNode；auto 时使用 sequence with delay
    const hasClick = animations.some(a => a.trigger === 'click');
    if (hasClick) {
      // 简单：所有 click 动画放在一个 sequence 中
      xml = '<p:timing><p:tnLst>';
      xml += '<p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot">';
      // First shape
      animBlocks.forEach((block, i) => {
        if (i === 0) {
          xml += block;
        } else {
          // Add to sequence
        }
      });
      xml += '</p:cTn></p:par></p:tnLst></p:timing>';
    } else {
      // Auto: use parallel container
      xml = '<p:timing><p:tnLst>';
      xml += '<p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"/>';
      // Wrap all animations in parallel timing
      xml += '<p:par><p:cTn id="2" preset="2" fill="hold" nodeType="parallel">';
      animBlocks.forEach(block => {
        xml += block;
      });
      xml += '</p:par></p:tnLst></p:timing>';
    }

    return xml;
  }

  private buildShapeAnimXml(
    anim: ShapeAnimation,
    shapeId: number,
    animId: number,
    nextId: number,
    delay: number,
    duration: number
  ): string {
    const durMs = duration;

    let effectXml = '';
    switch (anim.type) {
      case 'fade':
        effectXml = `<p:animEffectTransition filter="fade"><p:transition spd="${this.durationToSpeed(durMs)}"/></p:animEffectTransition>`;
        break;
      case 'float':
        effectXml = `<p:animMotion origin="auto" path="M 0 0 L 0 -30 L 0 0" dur="${durMs}ms"/>`;
        break;
      case 'scale':
        effectXml = `<p:animScale from="50,50" to="100,100" dur="${durMs}ms"/>`;
        break;
      case 'slide':
        effectXml = `<p:animMotion from="0,-1" to="0,0" dur="${durMs}ms"/>`;
        break;
      case 'bounce':
        effectXml = `<p:animMotion path="M 0 0 L 0 -50 L 0 0" dur="${durMs}ms" keypoints="0;0.5;1"/>`;
        break;
      case 'rotate':
        effectXml = `<p:animRot from="0" to="360" dur="${durMs}ms"/>`;
        break;
      case 'grow':
        effectXml = `<p:animScale from="0,0" to="100,100" dur="${durMs}ms"/>`;
        break;
      case 'shrink':
        effectXml = `<p:animScale from="100,100" to="50,50" dur="${durMs}ms"/>`;
        break;
      case 'appear':
        effectXml = '<p:set><p:to><p:strVal val="visible"/></p:to></p:set>';
        break;
      case 'dissolve':
        effectXml = '<p:animEffectTransition filter="dissolve"/>';
        break;
      default:
        effectXml = `<p:animEffectTransition filter="fade"/>`;
    }

    return `<p:par>
      <p:cTn id="${animId}" fill="hold" nodeType="clickEffect">
        <p:stCondLst><p:cond delay="${delay}ms" evt="onClick"/></p:stCondLst>
        ${effectXml}
        <p:tgtEl><p:spTgt spid="${shapeId}"/></p:tgtEl>
      </p:cTn>
    </p:par>`;
  }

  /**
   * 从 slide XML 中提取 shape ID 列表
   * 注意：PowerPoint 中 shape ID 在 <p:cNvPr id="X"/>
   */
  private extractShapeIds(xml: string): number[] {
    const ids: number[] = [];
    const regex = /<p:cNvPr\s+id="(\d+)"/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(xml)) !== null) {
      const id = parseInt(m[1], 10);
      if (id > 1) ids.push(id); // id=1 是 grpSpPr 本身
    }
    return ids;
  }

  /**
   * 将毫秒转为 PowerPoint 速度代码
   * PowerPoint 用 spd="slow|med|fast" 或自定义毫秒
   */
  private durationToSpeed(durationMs: number): string {
    if (durationMs <= 500) return 'fast';
    if (durationMs <= 1000) return 'med';
    return 'slow';
  }

  /**
   * 便捷方法：为已生成的 PPT 应用默认动画
   */
  static async applyDefaultAnimations(
    pptxPath: string,
    slideTypes: string[] = []
  ): Promise<string> {
    const mgr = new AnimationManager();
    const slideConfigs: SlideAnimationConfig[] = slideTypes.map(type => ({
      transition: mgr.defaultConfig.autoTransitionTypes.includes(type)
        ? mgr.defaultConfig.defaultTransition
        : undefined,
    }));
    return mgr.applyAnimations(pptxPath, slideConfigs);
  }
}

export default AnimationManager;
