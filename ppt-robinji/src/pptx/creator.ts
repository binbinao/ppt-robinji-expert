import PptxGenJS from 'pptxgenjs';
import { type PPTContent, type SlideContent } from '../ai/index.js';
import { getTemplate, type Template, type ColorPalette, type FontConfig, type DecorationConfig } from './templates/index.js';
import { DEFAULT_PALETTES, ALL_TEMPLATES } from './templates/index.js';
import {
  analyzeContent,
  decideLayout,
  checkOverflow,
  adjustFontSize,
  type ContentMetrics
} from './content-analyzer.js';

// 兼容旧接口
export { DEFAULT_PALETTES, ALL_TEMPLATES };
export type { ColorPalette, Template };

export interface CreatorOptions {
  /** 模板 ID（如 'business-classic'、'tech-neon' 等）*/
  template?: string;
  /** 向后兼容：配色方案 ID（已废弃，使用 template）*/
  palette?: string;
  author?: string;
  layout?: '16x9' | '16x10' | '4x3';
  /** 公司/组织名称（显示在页脚）*/
  company?: string;
  /** Logo URL 或文字（封面页）*/
  logo?: string;
  /** 是否在所有内容页显示页脚 */
  showFooter?: boolean;
  /** 自定义页脚文本 */
  footerText?: string;
}

export class PPTCreator {
  private pres: any;  // pptxgenjs shapes/charts 字段在类型定义中不可见
  private template: Template;

  constructor(options: CreatorOptions = {}) {
    this.pres = new PptxGenJS();

    // 优先使用 template，兼容旧的 palette 选项
    const templateId = options.template || options.palette || 'business-classic';
    this.template = getTemplate(templateId);

    // 设置布局
    switch (options.layout || '16x9') {
      case '16x10':
        this.pres.layout = 'LAYOUT_16x10';
        break;
      case '4x3':
        this.pres.layout = 'LAYOUT_4x3';
        break;
      default:
        this.pres.layout = 'LAYOUT_16x9';
    }

    this.pres.author = options.author || 'ppt-robinji';
    this.pres.company = options.company || 'Created with ppt-robinji';

    // 保存品牌信息
    this.brandOptions = {
      company: options.company || '',
      logo: options.logo || '',
      showFooter: options.showFooter !== false,
      footerText: options.footerText || ''
    };
  }

  private brandOptions: { company: string; logo: string; showFooter: boolean; footerText: string };

  async createFromOutline(content: PPTContent): Promise<void> {
    this.pres.title = content.title;
    if (content.subtitle) {
      this.pres.subject = content.subtitle;
    }

    // 封面页
    this.createTitleSlide(content);

    // 内容页 - 按类型分发
    for (let i = 0; i < content.slides.length; i++) {
      const slide = content.slides[i];
      const pageNum = i + 1;
      const totalPages = content.slides.length;

      switch (slide.type) {
        case 'cover':
        case 'title':
          this.createCoverSlide(slide);
          break;
        case 'agenda':
          this.createAgendaSlide(slide, pageNum, totalPages);
          break;
        case 'kpi':
          this.createKPISlide(slide, pageNum, totalPages);
          break;
        case 'quote':
          this.createQuoteSlide(slide, pageNum, totalPages);
          break;
        case 'comparison':
          this.createComparisonSlide(slide, pageNum, totalPages);
          break;
        case 'process':
          this.createProcessSlide(slide, pageNum, totalPages);
          break;
        case 'timeline':
          this.createTimelineSlide(slide, pageNum, totalPages);
          break;
        case 'divider':
          this.createDividerSlide(slide, pageNum, totalPages);
          break;
        case 'chart':
          this.createChartSlide(slide, pageNum, totalPages);
          break;
        case 'cta':
          this.createCTASlide(slide);
          break;
        case 'qa':
          this.createQASlide(slide);
          break;
        case 'thank-you':
          this.createThankYouSlide(slide);
          break;
        case 'conclusion':
          this.createConclusionSlide(slide.title || content.title);
          break;
        case 'two-column':
        case 'image':
        case 'content':
        default:
          this.createContentSlide(slide, pageNum, totalPages);
          break;
      }
    }
  }

  /**
   * 封面页
   */
  private createTitleSlide(content: PPTContent): void {
    const slide = this.pres.addSlide();
    const { palette, fonts, decoration } = this.template;

    // 背景（支持渐变）
    this.applyBackground(slide);

    // 根据标题风格渲染
    switch (decoration.titleStyle) {
      case 'classic':
        this.renderClassicTitle(slide, content, palette, fonts);
        break;
      case 'modern':
        this.renderModernTitle(slide, content, palette, fonts);
        break;
      case 'minimal':
        this.renderMinimalTitle(slide, content, palette, fonts);
        break;
      case 'elegant':
        this.renderElegantTitle(slide, content, palette, fonts);
        break;
      case 'bold':
        this.renderBoldTitle(slide, content, palette, fonts);
        break;
    }
  }

  /**
   * 内容页
   */
  private createContentSlide(slideContent: SlideContent, pageNum: number, totalPages: number): void {
    const slide = this.pres.addSlide();
    const { palette, fonts, decoration } = this.template;

    // 背景
    slide.background = { color: palette.background === palette.primary ? palette.surface : palette.background };

    // 标题
    this.renderContentHeader(slide, slideContent.title, palette, fonts);

    // 判断是否有图片，决定布局
    const hasImage = !!slideContent.imageUrl;
    const position = slideContent.imagePosition || 'right';

    if (hasImage) {
      // 图片 + 文字布局
      this.renderContentWithImage(slide, slideContent, palette, fonts, decoration, position);
    } else {
      // 纯文字布局（原有逻辑）
      switch (decoration.contentStyle) {
        case 'bullet':
          this.renderAdaptiveBullet(slide, slideContent.content, palette, fonts);
          break;
        case 'card':
          this.renderAdaptiveCard(slide, slideContent.content, palette, fonts);
          break;
        case 'timeline':
          this.renderAdaptiveTimeline(slide, slideContent.content, palette, fonts);
          break;
        case 'two-column':
          this.renderAdaptiveTwoColumn(slide, slideContent.content, palette, fonts);
          break;
        case 'icon':
          this.renderAdaptiveIcon(slide, slideContent.content, palette, fonts);
          break;
      }
    }

    // 演讲备注
    if (slideContent.notes) {
      slide.addNotes(slideContent.notes);
    }

    // 页码
    this.renderPageNumber(slide, pageNum, totalPages, palette, fonts);
  }

  /**
   * 结论页
   */
  private createConclusionSlide(title: string): void {
    const slide = this.pres.addSlide();
    const { palette, fonts } = this.template;

    slide.background = { color: palette.primary };

    slide.addText('谢谢', {
      x: 0.5, y: 1.8, w: 9, h: 1.2,
      fontSize: 56, fontFace: fonts.title,
      color: palette.text, bold: true, align: 'center'
    });

    slide.addText(title, {
      x: 0.5, y: 3.2, w: 9, h: 0.6,
      fontSize: 20, fontFace: fonts.body,
      color: palette.secondary, align: 'center'
    });

    // 装饰线
    slide.addShape(this.pres.shapes.RECTANGLE, {
      x: 3.5, y: 3.0, w: 3, h: 0.05,
      fill: { color: palette.accent }
    });
  }

  // ============ 背景应用 ============

  private applyBackground(slide: any): void {
    const { palette, decoration } = this.template;
    if (decoration.hasGradient) {
      // pptxgenjs 不直接支持 CSS 渐变，用两个色块叠加模拟
      slide.background = { color: palette.background };
    } else {
      slide.background = { color: palette.background };
    }
  }

  // ============ 标题风格渲染 ============

  private renderClassicTitle(slide: any, content: PPTContent, p: ColorPalette, f: FontConfig) {
    slide.addText(content.title, {
      x: 0.5, y: 2.2, w: 9, h: 1.2,
      fontSize: 44, fontFace: f.title,
      color: p.text, bold: true, align: 'center'
    });
    if (content.subtitle) {
      slide.addText(content.subtitle, {
        x: 0.5, y: 3.5, w: 9, h: 0.6,
        fontSize: 22, fontFace: f.body,
        color: p.secondary, align: 'center'
      });
    }
    slide.addShape(this.pres.shapes.RECTANGLE, {
      x: 4, y: 4.3, w: 2, h: 0.05,
      fill: { color: p.accent }
    });
  }

  private renderModernTitle(slide: any, content: PPTContent, p: ColorPalette, f: FontConfig) {
    // 左侧色块
    slide.addShape(this.pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.4, h: 5.625,
      fill: { color: p.accent }
    });
    slide.addText(content.title, {
      x: 0.8, y: 1.8, w: 8.7, h: 1.4,
      fontSize: 42, fontFace: f.title,
      color: p.text, bold: true, align: 'left'
    });
    if (content.subtitle) {
      slide.addText(content.subtitle, {
        x: 0.8, y: 3.2, w: 8.7, h: 0.6,
        fontSize: 20, fontFace: f.body,
        color: p.secondary, align: 'left'
      });
    }
    // 装饰圆点
    slide.addShape(this.pres.shapes.OVAL, {
      x: 8.8, y: 0.4, w: 0.6, h: 0.6,
      fill: { color: p.accent }
    });
  }

  private renderMinimalTitle(slide: any, content: PPTContent, p: ColorPalette, f: FontConfig) {
    slide.addText(content.title, {
      x: 0.8, y: 2.3, w: 8.4, h: 1.0,
      fontSize: 40, fontFace: f.title,
      color: p.text, bold: true, align: 'left'
    });
    if (content.subtitle) {
      slide.addText(content.subtitle, {
        x: 0.8, y: 3.3, w: 8.4, h: 0.5,
        fontSize: 18, fontFace: f.body,
        color: p.textSecondary, align: 'left'
      });
    }
  }

  private renderElegantTitle(slide: any, content: PPTContent, p: ColorPalette, f: FontConfig) {
    // 居中大字号
    slide.addText(content.title, {
      x: 0.5, y: 2.0, w: 9, h: 1.4,
      fontSize: 48, fontFace: f.title,
      color: p.text, bold: true, align: 'center'
    });
    if (content.subtitle) {
      slide.addText('— ' + content.subtitle + ' —', {
        x: 0.5, y: 3.4, w: 9, h: 0.5,
        fontSize: 18, fontFace: f.body,
        color: p.secondary, align: 'center', italic: true
      });
    }
    // 装饰横线
    slide.addShape(this.pres.shapes.RECTANGLE, {
      x: 3, y: 4.1, w: 4, h: 0.02,
      fill: { color: p.accent }
    });
  }

  private renderBoldTitle(slide: any, content: PPTContent, p: ColorPalette, f: FontConfig) {
    // 大字粗体背景块
    slide.addShape(this.pres.shapes.RECTANGLE, {
      x: 0, y: 1.8, w: 10, h: 2.0,
      fill: { color: p.primary, transparency: 70 }
    });
    slide.addText(content.title, {
      x: 0.5, y: 1.9, w: 9, h: 1.8,
      fontSize: 52, fontFace: f.title,
      color: p.text, bold: true, align: 'center', valign: 'middle'
    });
    if (content.subtitle) {
      slide.addText(content.subtitle, {
        x: 0.5, y: 4.0, w: 9, h: 0.5,
        fontSize: 18, fontFace: f.body,
        color: p.secondary, align: 'center'
      });
    }
  }

  // ============ 内容页头 ============

  private renderContentHeader(slide: any, title: string, p: ColorPalette, f: FontConfig) {
    // 标题栏背景
    slide.addShape(this.pres.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 1.0,
      fill: { color: p.primary }
    });
    // 标题文字
    slide.addText(title, {
      x: 0.5, y: 0.15, w: 9, h: 0.7,
      fontSize: f.titleSize - 4, fontFace: f.title,
      color: p.text, bold: true, margin: 0
    });
    // 装饰线
    slide.addShape(this.pres.shapes.RECTANGLE, {
      x: 0, y: 1.0, w: 10, h: 0.04,
      fill: { color: p.accent }
    });
  }

  // ============ 内容渲染（自适应）============

  /**
   * 自适应 Bullet 列表
   * - sparse: 大字、居中、多留白
   * - normal: 标准
   * - dense: 紧凑
   */
  private renderAdaptiveBullet(slide: any, items: string[], p: ColorPalette, f: FontConfig) {
    const metrics = analyzeContent(items);
    const layout = decideLayout(metrics, f);
    const overflow = checkOverflow(metrics, layout);

    if (metrics.density === 'sparse') {
      // 留白型：居中 + 大字
      const contentText = items.map((item, i) => ({
        text: item,
        options: {
          bullet: { code: '25A0' },
          breakLine: i < items.length - 1,
          fontSize: layout.fontSize,
          color: p.textSecondary || p.text,
          paraSpaceAfter: layout.itemSpacing
        }
      }));
      slide.addText(contentText, {
        x: 1.5, y: layout.topPadding, w: 7, h: 5.625 - layout.topPadding - layout.bottomPadding,
        fontSize: layout.fontSize, fontFace: f.body,
        color: p.textSecondary || p.text,
        align: 'center', valign: 'middle',
        lineSpacingMultiple: layout.lineSpacing
      });
    } else if (metrics.density === 'overflow') {
      // 溢出型：分两栏
      this.renderOverflowColumns(slide, items, p, f, layout);
    } else {
      // 正常 / 密集：标准列表
      const contentText = items.map((item, i) => ({
        text: item,
        options: {
          bullet: { code: '25A0' },
          breakLine: i < items.length - 1
        }
      }));
      slide.addText(contentText, {
        x: 0.6, y: layout.topPadding, w: 8.8, h: 5.625 - layout.topPadding - layout.bottomPadding,
        fontSize: layout.fontSize, fontFace: f.body,
        color: p.textSecondary || p.text,
        paraSpaceAfter: layout.itemSpacing,
        lineSpacingMultiple: layout.lineSpacing
      });
    }
  }

  /**
   * 自适应 Card 卡片网格
   * - sparse: 大卡片、居中、单列
   * - normal: 2 列卡片
   * - dense/overflow: 紧凑卡片网格
   */
  private renderAdaptiveCard(slide: any, items: string[], p: ColorPalette, f: FontConfig) {
    const metrics = analyzeContent(items);
    const layout = decideLayout(metrics, f);

    if (metrics.density === 'sparse') {
      // 留白型：1-2 个大卡片，居中
      this.renderLargeCards(slide, items, p, f);
    } else if (metrics.density === 'overflow') {
      // 溢出：3 列紧凑网格
      this.renderCardGrid(slide, items, p, f, 3, layout.fontSize);
    } else {
      // normal/dense: 2 列
      this.renderCardGrid(slide, items, p, f, 2, layout.fontSize);
    }
  }

  /**
   * 自适应 Timeline 时间线
   */
  private renderAdaptiveTimeline(slide: any, items: string[], p: ColorPalette, f: FontConfig) {
    const metrics = analyzeContent(items);
    const layout = decideLayout(metrics, f);

    if (metrics.density === 'sparse') {
      // 留白型：垂直居中、节点大
      this.renderVerticalTimeline(slide, items, p, f, layout, true);
    } else if (metrics.density === 'overflow') {
      // 溢出：2 列时间线
      this.renderTwoColumnTimeline(slide, items, p, f, layout);
    } else {
      this.renderVerticalTimeline(slide, items, p, f, layout, false);
    }
  }

  /**
   * 自适应两列布局
   */
  private renderAdaptiveTwoColumn(slide: any, items: string[], p: ColorPalette, f: FontConfig) {
    const metrics = analyzeContent(items);
    const layout = decideLayout(metrics, f);

    if (metrics.density === 'sparse') {
      // 留白型：每列只显示 1 个要点，大字
      this.renderTwoColumnSparse(slide, items, p, f, layout);
    } else if (metrics.density === 'overflow') {
      // 溢出：3 列
      this.renderMultiColumnContent(slide, items, p, f, 3, layout);
    } else {
      // normal/dense: 2 列
      this.renderMultiColumnContent(slide, items, p, f, 2, layout);
    }
  }

  /**
   * 自适应图标列表
   */
  private renderAdaptiveIcon(slide: any, items: string[], p: ColorPalette, f: FontConfig) {
    const metrics = analyzeContent(items);
    const layout = decideLayout(metrics, f);
    const icons = ['●', '◆', '▲', '■', '★', '♦', '♠', '♣', '▼', '◀', '▶', '◯'];

    if (metrics.density === 'sparse') {
      // 留白型：图标大、垂直居中
      items.forEach((item, i) => {
        const y = 2.0 + i * 1.0;
        slide.addText(icons[i % icons.length], {
          x: 1.0, y, w: 0.8, h: 0.8,
          fontSize: 36, fontFace: f.body,
          color: p.accent, align: 'center'
        });
        slide.addText(item, {
          x: 2.0, y: y + 0.1, w: 7, h: 0.7,
          fontSize: layout.fontSize, fontFace: f.body,
          color: p.textSecondary || p.text
        });
      });
    } else if (metrics.density === 'overflow') {
      // 溢出：2 列图标网格
      const half = Math.ceil(items.length / 2);
      const left = items.slice(0, half);
      const right = items.slice(half);
      [left, right].forEach((col, ci) => {
        col.forEach((item, i) => {
          const x = ci === 0 ? 0.5 : 5.2;
          const y = 1.4 + i * 0.6;
          slide.addText(icons[(i + ci * half) % icons.length], {
            x, y, w: 0.4, h: 0.4,
            fontSize: 18, fontFace: f.body,
            color: p.accent, align: 'center'
          });
          slide.addText(item, {
            x: x + 0.5, y, w: 4.0, h: 0.5,
            fontSize: layout.fontSize, fontFace: f.body,
            color: p.textSecondary || p.text
          });
        });
      });
    } else {
      // normal/dense: 单列紧凑
      items.forEach((item, i) => {
        const y = 1.4 + i * layout.itemSpacing / 12;
        slide.addText(icons[i % icons.length], {
          x: 0.7, y, w: 0.5, h: 0.5,
          fontSize: 20, fontFace: f.body,
          color: p.accent, align: 'center'
        });
        slide.addText(item, {
          x: 1.3, y, w: 8, h: 0.5,
          fontSize: layout.fontSize, fontFace: f.body,
          color: p.textSecondary || p.text
        });
      });
    }
  }

  // ============ 辅助渲染方法 ============

  /**
   * 渲染大卡片（留白型，1-2 个要点）
   */
  private renderLargeCards(slide: any, items: string[], p: ColorPalette, f: FontConfig) {
    const cardW = 7.5;
    const cardH = 1.4;
    const startY = 1.5;
    const gapY = 0.4;

    items.forEach((item, i) => {
      const y = startY + i * (cardH + gapY);
      // 大卡片
      slide.addShape(this.pres.shapes.RECTANGLE, {
        x: (10 - cardW) / 2, y, w: cardW, h: cardH,
        fill: { color: p.surface },
        line: { color: p.border, width: 1.5 }
      });
      // 顶部色条
      slide.addShape(this.pres.shapes.RECTANGLE, {
        x: (10 - cardW) / 2, y, w: cardW, h: 0.08,
        fill: { color: p.accent }
      });
      // 序号
      slide.addText(String(i + 1).padStart(2, '0'), {
        x: (10 - cardW) / 2 + 0.2, y: y + 0.2, w: 0.8, h: 0.4,
        fontSize: 18, fontFace: f.body,
        color: p.accent, bold: true
      });
      // 文本
      slide.addText(item, {
        x: (10 - cardW) / 2 + 1.0, y: y + 0.2, w: cardW - 1.2, h: cardH - 0.4,
        fontSize: 20, fontFace: f.body,
        color: p.textSecondary || p.text, valign: 'middle'
      });
    });
  }

  /**
   * 渲染 N 列卡片网格
   */
  private renderCardGrid(slide: any, items: string[], p: ColorPalette, f: FontConfig, cols: number, fontSize: number) {
    const padding = 0.5;
    const gap = 0.2;
    const totalW = 10 - 2 * padding;
    const cardW = (totalW - (cols - 1) * gap) / cols;

    // 估算行数
    const rows = Math.ceil(items.length / cols);
    const totalContentHeight = 5.625 - 1.4 - 0.4; // 标题区 + 页码
    const cardH = Math.min(1.4, totalContentHeight / rows - gap);

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * (cardW + gap);
      const y = 1.4 + row * (cardH + gap);

      slide.addShape(this.pres.shapes.RECTANGLE, {
        x, y, w: cardW, h: cardH,
        fill: { color: p.surface },
        line: { color: p.border, width: 0.75 }
      });
      // 左侧色条
      slide.addShape(this.pres.shapes.RECTANGLE, {
        x, y, w: 0.08, h: cardH,
        fill: { color: p.accent }
      });
      // 序号
      slide.addText(`#${i + 1}`, {
        x: x + 0.18, y: y + 0.08, w: 0.6, h: 0.25,
        fontSize: 9, fontFace: f.body,
        color: p.accent, bold: true
      });
      // 文本（根据文本长度微调字号）
      const adjustedSize = adjustFontSize(fontSize, item, item.length > 30);
      slide.addText(item, {
        x: x + 0.18, y: y + 0.3, w: cardW - 0.3, h: cardH - 0.4,
        fontSize: adjustedSize, fontFace: f.body,
        color: p.textSecondary || p.text, valign: 'top'
      });
    });
  }

  /**
   * 渲染多列内容（用于 overflow）
   */
  private renderMultiColumnContent(slide: any, items: string[], p: ColorPalette, f: FontConfig, cols: number, layout: any) {
    const colW = (10 - 1.0) / cols; // 总宽 9，左右各 0.5
    const perCol = Math.ceil(items.length / cols);
    const itemH = 0.55;
    const startY = 1.4;

    for (let c = 0; c < cols; c++) {
      const colItems = items.slice(c * perCol, (c + 1) * perCol);
      const x = 0.5 + c * colW;

      // 装饰竖线
      slide.addShape(this.pres.shapes.RECTANGLE, {
        x, y: startY, w: 0.04, h: colItems.length * itemH,
        fill: { color: p.accent }
      });

      colItems.forEach((item, i) => {
        const y = startY + i * itemH;
        const adjustedSize = adjustFontSize(layout.fontSize, item, item.length > 30);
        slide.addText(item, {
          x: x + 0.15, y, w: colW - 0.2, h: itemH - 0.05,
          fontSize: adjustedSize, fontFace: f.body,
          color: p.textSecondary || p.text, valign: 'top'
        });
      });
    }
  }

  /**
   * 垂直时间线
   */
  private renderVerticalTimeline(slide: any, items: string[], p: ColorPalette, f: FontConfig, layout: any, sparse: boolean) {
    const startX = sparse ? 1.5 : 1.0;
    const startY = sparse ? 1.8 : 1.4;
    const stepY = sparse ? 1.0 : Math.min(0.75, (5.625 - startY - 0.5) / items.length);
    const nodeSize = sparse ? 0.4 : 0.3;

    // 主线
    slide.addShape(this.pres.shapes.RECTANGLE, {
      x: startX - 0.02, y: startY, w: 0.04, h: stepY * (items.length - 1) + nodeSize,
      fill: { color: p.accent }
    });

    items.forEach((item, i) => {
      const y = startY + i * stepY;
      // 节点
      slide.addShape(this.pres.shapes.OVAL, {
        x: startX - nodeSize / 2, y, w: nodeSize, h: nodeSize,
        fill: { color: p.accent }
      });
      // 文本
      const adjustedSize = adjustFontSize(layout.fontSize, item, item.length > 30);
      slide.addText(item, {
        x: startX + 0.4, y: y - 0.05, w: 10 - startX - 0.5, h: stepY - 0.1,
        fontSize: adjustedSize, fontFace: f.body,
        color: p.textSecondary || p.text, valign: 'middle'
      });
    });
  }

  /**
   * 双列时间线
   */
  private renderTwoColumnTimeline(slide: any, items: string[], p: ColorPalette, f: FontConfig, layout: any) {
    const half = Math.ceil(items.length / 2);
    const col1 = items.slice(0, half);
    const col2 = items.slice(half);

    [col1, col2].forEach((colItems, ci) => {
      const startX = ci === 0 ? 1.0 : 5.5;
      const startY = 1.4;
      const stepY = Math.min(0.6, (5.625 - startY - 0.5) / colItems.length);

      // 主线
      slide.addShape(this.pres.shapes.RECTANGLE, {
        x: startX - 0.02, y: startY, w: 0.04, h: stepY * colItems.length,
        fill: { color: p.accent }
      });

      colItems.forEach((item, i) => {
        const y = startY + i * stepY;
        slide.addShape(this.pres.shapes.OVAL, {
          x: startX - 0.12, y, w: 0.24, h: 0.24,
          fill: { color: p.accent }
        });
        const adjustedSize = adjustFontSize(layout.fontSize, item, item.length > 30);
        slide.addText(item, {
          x: startX + 0.25, y: y - 0.05, w: 3.5, h: stepY - 0.05,
          fontSize: adjustedSize, fontFace: f.body,
          color: p.textSecondary || p.text
        });
      });
    });
  }

  /**
   * 双列稀疏布局
   */
  private renderTwoColumnSparse(slide: any, items: string[], p: ColorPalette, f: FontConfig, layout: any) {
    const half = Math.ceil(items.length / 2);
    const left = items.slice(0, half);
    const right = items.slice(half);

    [left, right].forEach((colItems, ci) => {
      colItems.forEach((item, i) => {
        const x = ci === 0 ? 1.0 : 5.5;
        const y = 1.8 + i * 1.4;
        // 装饰方块
        slide.addShape(this.pres.shapes.RECTANGLE, {
          x, y, w: 0.3, h: 0.3,
          fill: { color: p.accent }
        });
        // 文本
        slide.addText(item, {
          x: x + 0.4, y: y - 0.05, w: 3.0, h: 1.2,
          fontSize: 18, fontFace: f.body,
          color: p.textSecondary || p.text, valign: 'top'
        });
      });
    });
  }

  /**
   * 溢出分栏（bullet 用）
   */
  private renderOverflowColumns(slide: any, items: string[], p: ColorPalette, f: FontConfig, layout: any) {
    this.renderMultiColumnContent(slide, items, p, f, 2, layout);
  }

  // ============ 图片渲染 ============

  /**
   * 渲染带图片的内容页
   * 支持 4 种位置：left / right / top / bottom
   * 自动根据内容密度和图片位置调整文字区域大小
   */
  private renderContentWithImage(
    slide: any,
    slideContent: SlideContent,
    p: ColorPalette,
    f: FontConfig,
    decoration: DecorationConfig,
    position: 'left' | 'right' | 'top' | 'bottom'
  ): void {
    const items = slideContent.content;
    const metrics = analyzeContent(items);
    const layout = decideLayout(metrics, f);

    // 根据位置计算图片和文字区域
    let imgRect: { x: number; y: number; w: number; h: number };
    let textRect: { x: number; y: number; w: number; h: number };

    switch (position) {
      case 'left':
        imgRect = { x: 0.5, y: 1.3, w: 3.5, h: 3.7 };
        textRect = { x: 4.3, y: 1.3, w: 5.2, h: 3.7 };
        break;
      case 'right':
        imgRect = { x: 6.0, y: 1.3, w: 3.5, h: 3.7 };
        textRect = { x: 0.5, y: 1.3, w: 5.2, h: 3.7 };
        break;
      case 'top':
        imgRect = { x: 2.5, y: 1.2, w: 5.0, h: 1.8 };
        textRect = { x: 0.5, y: 3.1, w: 9.0, h: 2.0 };
        break;
      case 'bottom':
        imgRect = { x: 2.5, y: 3.4, w: 5.0, h: 1.8 };
        textRect = { x: 0.5, y: 1.3, w: 9.0, h: 2.0 };
        break;
      default:
        imgRect = { x: 6.0, y: 1.3, w: 3.5, h: 3.7 };
        textRect = { x: 0.5, y: 1.3, w: 5.2, h: 3.7 };
    }

    // 渲染图片（带装饰边框）
    this.renderImageWithDecoration(slide, slideContent.imageUrl!, imgRect, p);

    // 渲染文字（在 textRect 区域内）
    this.renderTextInRect(slide, items, textRect, p, f, layout, decoration.contentStyle);
  }

  /**
   * 渲染图片 + 装饰
   */
  private renderImageWithDecoration(
    slide: any,
    imageUrl: string,
    rect: { x: number; y: number; w: number; h: number },
    p: ColorPalette
  ): void {
    const { decoration } = this.template;

    // 阴影/装饰背景框
    if (decoration.hasShadow) {
      slide.addShape(this.pres.shapes.RECTANGLE, {
        x: rect.x + 0.05, y: rect.y + 0.05, w: rect.w, h: rect.h,
        fill: { color: '000000', transparency: 90 },
        line: { type: 'none' }
      });
    }

    // 装饰边框
    if (decoration.cornerRadius > 0) {
      // 用圆角矩形作为底
      slide.addShape(this.pres.shapes.ROUNDED_RECTANGLE, {
        x: rect.x - 0.05, y: rect.y - 0.05, w: rect.w + 0.1, h: rect.h + 0.1,
        fill: { color: p.surface },
        line: { color: p.accent, width: 1.5 }
      });
    } else {
      // 简单矩形边框
      slide.addShape(this.pres.shapes.RECTANGLE, {
        x: rect.x - 0.03, y: rect.y - 0.03, w: rect.w + 0.06, h: rect.h + 0.06,
        fill: { type: 'none' },
        line: { color: p.accent, width: 1 }
      });
    }

    // 添加图片（带 fallback）
    try {
      slide.addImage({
        path: imageUrl,
        x: rect.x, y: rect.y, w: rect.w, h: rect.h,
        sizing: { type: 'cover', w: rect.w, h: rect.h }
      });
    } catch (err) {
      // 图片加载失败，显示占位符
      console.warn('图片加载失败:', (err as Error).message);
      slide.addText('🖼️ 图片', {
        x: rect.x, y: rect.y, w: rect.w, h: rect.h,
        fontSize: 24, fontFace: 'Microsoft YaHei',
        color: p.textSecondary, align: 'center', valign: 'middle'
      });
    }
  }

  /**
   * 在指定矩形区域渲染文字
   */
  private renderTextInRect(
    slide: any,
    items: string[],
    rect: { x: number; y: number; w: number; h: number },
    p: ColorPalette,
    f: FontConfig,
    layout: any,
    contentStyle: string
  ): void {
    // 根据内容样式选择
    if (contentStyle === 'card' || items.length >= 4) {
      // 卡片网格（在限定区域内）
      this.renderCompactCards(slide, items, rect, p, f, layout);
    } else {
      // 项目符号列表
      const contentText = items.map((item, i) => ({
        text: item,
        options: {
          bullet: { code: '25A0' },
          breakLine: i < items.length - 1
        }
      }));
      slide.addText(contentText, {
        x: rect.x, y: rect.y, w: rect.w, h: rect.h,
        fontSize: layout.fontSize, fontFace: f.body,
        color: p.textSecondary || p.text,
        paraSpaceAfter: layout.itemSpacing,
        lineSpacingMultiple: layout.lineSpacing,
        valign: 'top'
      });
    }
  }

  /**
   * 紧凑卡片（在指定区域内）
   */
  private renderCompactCards(
    slide: any,
    items: string[],
    rect: { x: number; y: number; w: number; h: number },
    p: ColorPalette,
    f: FontConfig,
    layout: any
  ): void {
    const cols = items.length <= 4 ? 1 : 2;
    const rows = Math.ceil(items.length / cols);
    const cardW = (rect.w - (cols - 1) * 0.15) / cols;
    const cardH = (rect.h - (rows - 1) * 0.15) / rows;

    items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = rect.x + col * (cardW + 0.15);
      const y = rect.y + row * (cardH + 0.15);

      slide.addShape(this.pres.shapes.RECTANGLE, {
        x, y, w: cardW, h: cardH,
        fill: { color: p.surface },
        line: { color: p.border, width: 0.5 }
      });
      slide.addShape(this.pres.shapes.RECTANGLE, {
        x, y, w: 0.06, h: cardH,
        fill: { color: p.accent }
      });
      slide.addText(`#${i + 1}`, {
        x: x + 0.15, y: y + 0.05, w: 0.5, h: 0.2,
        fontSize: 8, fontFace: f.body,
        color: p.accent, bold: true
      });
      const adjustedSize = adjustFontSize(layout.fontSize, item, item.length > 30);
      slide.addText(item, {
        x: x + 0.15, y: y + 0.25, w: cardW - 0.2, h: cardH - 0.3,
        fontSize: adjustedSize, fontFace: f.body,
        color: p.textSecondary || p.text, valign: 'top'
      });
    });
  }

  // ============ 页码 ============

  private renderPageNumber(slide: any, current: number, total: number, p: ColorPalette, f: FontConfig) {
    slide.addText(`${current} / ${total}`, {
      x: 8.8, y: 5.2, w: 1.0, h: 0.3,
      fontSize: 10, fontFace: f.body,
      color: p.textSecondary, align: 'right'
    });
  }

  // ============ 公共方法 ============

  async save(filePath: string): Promise<void> {
    await this.pres.writeFile({ fileName: filePath });
  }

  getPresentation(): PptxGenJS {
    return this.pres;
  }

  getTemplate(): Template {
    return this.template;
  }

  // ============================================================
  //  P0 改进：14 种专业 Slide 类型渲染器
  // ============================================================

  /**
   * Cover Slide - 增强封面（带 hook 元素 + logo）
   */
  private createCoverSlide(slide: any): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.background };

    // Logo 占位（顶部）
    if (this.brandOptions.logo) {
      slideObj.addText(this.brandOptions.logo, {
        x: 0.5, y: 0.4, w: 3, h: 0.5,
        fontSize: 18, fontFace: fonts.title,
        color: palette.accent, bold: true, align: 'left'
      });
    }

    // 大标题
    slideObj.addText(slide.title, {
      x: 0.5, y: 1.8, w: 9, h: 1.5,
      fontSize: 48, fontFace: fonts.title,
      color: palette.text, bold: true, align: 'center'
    });

    // 副标题/钩子
    if (slide.content && slide.content[0]) {
      slideObj.addText(slide.content[0], {
        x: 0.5, y: 3.3, w: 9, h: 0.6,
        fontSize: 22, fontFace: fonts.body,
        color: palette.secondary, align: 'center', italic: true
      });
    }

    // 装饰
    slideObj.addShape(this.pres.shapes.RECTANGLE, {
      x: 3.5, y: 4.2, w: 3, h: 0.05,
      fill: { color: palette.accent }
    });

    // 作者/日期
    if (slide.content && slide.content[1]) {
      slideObj.addText(slide.content[1], {
        x: 0.5, y: 4.6, w: 9, h: 0.4,
        fontSize: 14, fontFace: fonts.body,
        color: palette.textSecondary, align: 'center'
      });
    }

    // 公司名（底部）
    if (this.brandOptions.company) {
      slideObj.addText(this.brandOptions.company, {
        x: 0.5, y: 5.2, w: 9, h: 0.3,
        fontSize: 11, fontFace: fonts.body,
        color: palette.textSecondary, align: 'center', charSpacing: 2
      });
    }

    this.addSpeakerNotes(slideObj, slide.notes);
  }

  /**
   * Agenda Slide - 目录
   */
  private createAgendaSlide(slide: any, pageNum: number, totalPages: number): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.background };

    // 标题
    slideObj.addText(slide.title, {
      x: 0.5, y: 0.4, w: 9, h: 0.8,
      fontSize: 32, fontFace: fonts.title,
      color: palette.text, bold: true
    });
    slideObj.addShape(this.pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.2, w: 0.8, h: 0.05,
      fill: { color: palette.accent }
    });

    // 目录项（数字 + 标题）
    const items = slide.content || [];
    const itemHeight = 0.7;
    const startY = 1.7;
    items.forEach((item: string, i: number) => {
      const y = startY + i * itemHeight;
      // 序号
      slideObj.addText(String(i + 1).padStart(2, '0'), {
        x: 0.7, y, w: 0.8, h: itemHeight - 0.1,
        fontSize: 28, fontFace: fonts.title,
        color: palette.accent, bold: true
      });
      // 标题
      slideObj.addText(item, {
        x: 1.7, y, w: 7.5, h: itemHeight - 0.1,
        fontSize: 18, fontFace: fonts.body,
        color: palette.text, valign: 'middle'
      });
    });

    this.renderPageNumberOn(slideObj, pageNum, totalPages);
    this.addSpeakerNotes(slideObj, slide.notes);
  }

  /**
   * KPI Slide - 数据卡片（hero number）
   */
  private createKPISlide(slide: any, pageNum: number, totalPages: number): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.surface };

    // 小标签
    if (slide.kpiContext) {
      slideObj.addText(slide.kpiContext.toUpperCase(), {
        x: 0.5, y: 0.8, w: 9, h: 0.4,
        fontSize: 14, fontFace: fonts.body,
        color: palette.accent, bold: true, align: 'center', charSpacing: 4
      });
    }

    // 巨大数字
    const kpiText = (slide.kpiValue || slide.content[0] || '0') + (slide.kpiUnit ? ' ' + slide.kpiUnit : '');
    slideObj.addText(kpiText, {
      x: 0.5, y: 1.5, w: 9, h: 2.2,
      fontSize: 96, fontFace: fonts.title,
      color: palette.primary, bold: true, align: 'center', valign: 'middle'
    });

    // 描述
    const desc = slide.title;
    slideObj.addText(desc, {
      x: 1, y: 4.0, w: 8, h: 0.8,
      fontSize: 20, fontFace: fonts.body,
      color: palette.textSecondary, align: 'center', italic: true
    });

    this.renderPageNumberOn(slideObj, pageNum, totalPages);
    this.addSpeakerNotes(slideObj, slide.notes);
  }

  /**
   * Quote Slide - 引用
   */
  private createQuoteSlide(slide: any, pageNum: number, totalPages: number): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.background };

    // 大引号
    slideObj.addText('"', {
      x: 0.5, y: 0.5, w: 1.5, h: 1.5,
      fontSize: 120, fontFace: 'Georgia',
      color: palette.accent, bold: true
    });

    // 引用文字
    const quoteText = slide.content.join(' ');
    slideObj.addText(quoteText, {
      x: 1.5, y: 1.5, w: 7.5, h: 2.2,
      fontSize: 26, fontFace: fonts.body,
      color: palette.text, italic: true, valign: 'middle'
    });

    // 作者
    const author = slide.quoteAuthor || slide.title;
    slideObj.addText(`- ${author}`, {
      x: 1.5, y: 4.0, w: 7.5, h: 0.4,
      fontSize: 16, fontFace: fonts.body,
      color: palette.secondary, align: 'right'
    });

    // 来源
    if (slide.quoteSource) {
      slideObj.addText(slide.quoteSource, {
        x: 1.5, y: 4.4, w: 7.5, h: 0.3,
        fontSize: 12, fontFace: fonts.body,
        color: palette.textSecondary, align: 'right', italic: true
      });
    }

    this.renderPageNumberOn(slideObj, pageNum, totalPages);
    this.addSpeakerNotes(slideObj, slide.notes);
  }

  /**
   * Comparison Slide - 对比
   */
  private createComparisonSlide(slide: any, pageNum: number, totalPages: number): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.background };

    // 标题
    slideObj.addText(slide.title, {
      x: 0.5, y: 0.4, w: 9, h: 0.7,
      fontSize: 28, fontFace: fonts.title,
      color: palette.text, bold: true
    });

    // 两列
    const a = slide.comparisonA || { title: 'Before', items: slide.content.slice(0, Math.ceil(slide.content.length / 2)) };
    const b = slide.comparisonB || { title: 'After', items: slide.content.slice(Math.ceil(slide.content.length / 2)) };

    // 左列（A）
    slideObj.addShape(this.pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.3, w: 4.3, h: 3.5,
      fill: { color: palette.surface },
      line: { color: palette.border, width: 1 }
    });
    slideObj.addText(a.title, {
      x: 0.5, y: 1.4, w: 4.3, h: 0.5,
      fontSize: 18, fontFace: fonts.title,
      color: palette.textSecondary, bold: true, align: 'center'
    });
    (a.items || []).forEach((item: string, i: number) => {
      slideObj.addText('x ' + item, {
        x: 0.7, y: 2.0 + i * 0.45, w: 4.0, h: 0.4,
        fontSize: 14, fontFace: fonts.body,
        color: palette.textSecondary
      });
    });

    // 右列（B）
    slideObj.addShape(this.pres.shapes.RECTANGLE, {
      x: 5.2, y: 1.3, w: 4.3, h: 3.5,
      fill: { color: palette.primary },
      line: { type: 'none' }
    });
    slideObj.addText(b.title, {
      x: 5.2, y: 1.4, w: 4.3, h: 0.5,
      fontSize: 18, fontFace: fonts.title,
      color: palette.text, bold: true, align: 'center'
    });
    (b.items || []).forEach((item: string, i: number) => {
      slideObj.addText('+ ' + item, {
        x: 5.4, y: 2.0 + i * 0.45, w: 4.0, h: 0.4,
        fontSize: 14, fontFace: fonts.body,
        color: palette.text
      });
    });

    // 中央箭头
    slideObj.addText('->', {
      x: 4.7, y: 2.8, w: 0.6, h: 0.6,
      fontSize: 36, fontFace: 'Arial',
      color: palette.accent, bold: true, align: 'center'
    });

    this.renderPageNumberOn(slideObj, pageNum, totalPages);
    this.addSpeakerNotes(slideObj, slide.notes);
  }

  /**
   * Process Slide - 流程步骤
   */
  private createProcessSlide(slide: any, pageNum: number, totalPages: number): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.background };

    slideObj.addText(slide.title, {
      x: 0.5, y: 0.4, w: 9, h: 0.7,
      fontSize: 28, fontFace: fonts.title,
      color: palette.text, bold: true
    });

    const steps = slide.steps || slide.content.map((c: string) => ({ title: c, description: '' }));
    const stepCount = steps.length;
    const stepWidth = 9 / stepCount;
    const stepY = 1.5;
    const stepH = 3.0;

    steps.forEach((step: any, i: number) => {
      const x = 0.5 + i * stepWidth;
      // 圆圈序号
      slideObj.addShape(this.pres.shapes.OVAL, {
        x: x + stepWidth / 2 - 0.4, y: stepY, w: 0.8, h: 0.8,
        fill: { color: palette.accent }
      });
      slideObj.addText(String(i + 1), {
        x: x + stepWidth / 2 - 0.4, y: stepY, w: 0.8, h: 0.8,
        fontSize: 32, fontFace: fonts.title,
        color: palette.text, bold: true, align: 'center', valign: 'middle'
      });

      // 连接线（除了最后一个）
      if (i < stepCount - 1) {
        slideObj.addShape(this.pres.shapes.RECTANGLE, {
          x: x + stepWidth / 2 + 0.4, y: stepY + 0.38, w: stepWidth - 0.8, h: 0.04,
          fill: { color: palette.accent }
        });
      }

      // 步骤标题
      slideObj.addText(step.title, {
        x: x + 0.1, y: stepY + 1.0, w: stepWidth - 0.2, h: 0.5,
        fontSize: 14, fontFace: fonts.title,
        color: palette.text, bold: true, align: 'center'
      });

      // 步骤描述
      if (step.description) {
        slideObj.addText(step.description, {
          x: x + 0.1, y: stepY + 1.5, w: stepWidth - 0.2, h: 1.4,
          fontSize: 11, fontFace: fonts.body,
          color: palette.textSecondary, align: 'center', valign: 'top'
        });
      }
    });

    this.renderPageNumberOn(slideObj, pageNum, totalPages);
    this.addSpeakerNotes(slideObj, slide.notes);
  }

  /**
   * Timeline Slide - 时间线
   */
  private createTimelineSlide(slide: any, pageNum: number, totalPages: number): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.background };

    slideObj.addText(slide.title, {
      x: 0.5, y: 0.4, w: 9, h: 0.7,
      fontSize: 28, fontFace: fonts.title,
      color: palette.text, bold: true
    });

    const events = slide.events || slide.content.map((c: string) => ({ date: '', title: c, description: '' }));
    const eventCount = events.length;
    const eventWidth = 9 / eventCount;
    const lineY = 2.3;

    // 主线
    slideObj.addShape(this.pres.shapes.RECTANGLE, {
      x: 0.5, y: lineY, w: 9, h: 0.04,
      fill: { color: palette.accent }
    });

    events.forEach((evt: any, i: number) => {
      const cx = 0.5 + i * eventWidth + eventWidth / 2;
      // 节点
      slideObj.addShape(this.pres.shapes.OVAL, {
        x: cx - 0.15, y: lineY - 0.13, w: 0.3, h: 0.3,
        fill: { color: palette.accent }
      });
      // 日期（在节点上方）
      if (evt.date) {
        slideObj.addText(evt.date, {
          x: cx - 0.8, y: lineY - 0.7, w: 1.6, h: 0.4,
          fontSize: 12, fontFace: fonts.body,
          color: palette.accent, bold: true, align: 'center'
        });
      }
      // 标题（在节点下方）
      slideObj.addText(evt.title, {
        x: cx - eventWidth / 2 + 0.1, y: lineY + 0.3, w: eventWidth - 0.2, h: 0.5,
        fontSize: 13, fontFace: fonts.title,
        color: palette.text, bold: true, align: 'center'
      });
      // 描述
      if (evt.description) {
        slideObj.addText(evt.description, {
          x: cx - eventWidth / 2 + 0.1, y: lineY + 0.85, w: eventWidth - 0.2, h: 1.5,
          fontSize: 10, fontFace: fonts.body,
          color: palette.textSecondary, align: 'center', valign: 'top'
        });
      }
    });

    this.renderPageNumberOn(slideObj, pageNum, totalPages);
    this.addSpeakerNotes(slideObj, slide.notes);
  }

  /**
   * Divider Slide - 章节分隔
   */
  private createDividerSlide(slide: any, pageNum: number, totalPages: number): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.primary };

    // 章节编号
    if (slide.content && slide.content[0]) {
      slideObj.addText(slide.content[0], {
        x: 0.5, y: 1.8, w: 9, h: 0.6,
        fontSize: 18, fontFace: fonts.body,
        color: palette.accent, align: 'center', charSpacing: 8
      });
    }

    // 章节名
    slideObj.addText(slide.title, {
      x: 0.5, y: 2.5, w: 9, h: 1.2,
      fontSize: 56, fontFace: fonts.title,
      color: palette.text, bold: true, align: 'center'
    });

    // 装饰横线
    slideObj.addShape(this.pres.shapes.RECTANGLE, {
      x: 4, y: 3.9, w: 2, h: 0.06,
      fill: { color: palette.accent }
    });

    this.renderPageNumberOn(slideObj, pageNum, totalPages);
    this.addSpeakerNotes(slideObj, slide.notes);
  }

  /**
   * Chart Slide - 图表
   */
  private createChartSlide(slide: any, pageNum: number, totalPages: number): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.background };

    slideObj.addText(slide.title, {
      x: 0.5, y: 0.4, w: 9, h: 0.7,
      fontSize: 28, fontFace: fonts.title,
      color: palette.text, bold: true
    });

    const chartData = slide.chartData;
    if (chartData && chartData.labels && chartData.values) {
      const chartColors = [palette.primary, palette.accent, palette.secondary, palette.surface];

      let chartType: any = this.pres.charts.BAR;
      if (chartData.type === 'line') chartType = this.pres.charts.LINE;
      else if (chartData.type === 'pie') chartType = this.pres.charts.PIE;
      else if (chartData.type === 'area') chartType = this.pres.charts.AREA;

      const data = [{
        name: chartData.title,
        labels: chartData.labels,
        values: chartData.values
      }];

      slideObj.addChart(chartType, data, {
        x: 0.5, y: 1.3, w: 9, h: 3.5,
        chartColors: chartColors,
        showLegend: chartData.type === 'pie',
        showTitle: false,
        catAxisLabelFontSize: 10,
        valAxisLabelFontSize: 10
      });
    } else {
      // 无 chartData 时显示占位
      slideObj.addText('[Chart data not provided]', {
        x: 0.5, y: 2.0, w: 9, h: 0.6,
        fontSize: 16, fontFace: fonts.body,
        color: palette.textSecondary, align: 'center'
      });
    }

    this.renderPageNumberOn(slideObj, pageNum, totalPages);
    this.addSpeakerNotes(slideObj, slide.notes);
  }

  /**
   * CTA Slide - 行动号召
   */
  private createCTASlide(slide: any): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.primary };

    // 主CTA
    slideObj.addText(slide.title, {
      x: 0.5, y: 1.5, w: 9, h: 1.5,
      fontSize: 44, fontFace: fonts.title,
      color: palette.text, bold: true, align: 'center'
    });

    // 子行动
    if (slide.content && slide.content[0]) {
      slideObj.addText(slide.content[0], {
        x: 1, y: 3.0, w: 8, h: 0.6,
        fontSize: 20, fontFace: fonts.body,
        color: palette.secondary, align: 'center'
      });
    }

    // 强调框（联系方式/链接）
    if (slide.content && slide.content[1]) {
      slideObj.addShape(this.pres.shapes.ROUNDED_RECTANGLE, {
        x: 2.5, y: 4.0, w: 5, h: 0.7,
        fill: { color: palette.accent },
        line: { type: 'none' }
      });
      slideObj.addText(slide.content[1], {
        x: 2.5, y: 4.0, w: 5, h: 0.7,
        fontSize: 20, fontFace: fonts.body,
        color: palette.text, bold: true, align: 'center', valign: 'middle'
      });
    }

    this.addSpeakerNotes(slideObj, slide.notes);
  }

  /**
   * Q&A Slide - 问答页
   */
  private createQASlide(slide: any): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.background };

    slideObj.addText('Q & A', {
      x: 0.5, y: 1.8, w: 9, h: 1.5,
      fontSize: 96, fontFace: fonts.title,
      color: palette.primary, bold: true, align: 'center'
    });

    if (slide.title && slide.title !== 'Q & A') {
      slideObj.addText(slide.title, {
        x: 0.5, y: 3.5, w: 9, h: 0.5,
        fontSize: 20, fontFace: fonts.body,
        color: palette.textSecondary, align: 'center', italic: true
      });
    }

    this.addSpeakerNotes(slideObj, slide.notes);
  }

  /**
   * Thank You Slide - 致谢
   */
  private createThankYouSlide(slide: any): void {
    const slideObj = this.pres.addSlide();
    const { palette, fonts } = this.template;
    slideObj.background = { color: palette.primary };

    slideObj.addText('Thank You', {
      x: 0.5, y: 1.8, w: 9, h: 1.2,
      fontSize: 72, fontFace: fonts.title,
      color: palette.text, bold: true, align: 'center'
    });

    // 联系方式
    if (slide.content && slide.content.length > 0) {
      slideObj.addText(slide.content.join(' | '), {
        x: 0.5, y: 3.5, w: 9, h: 0.5,
        fontSize: 16, fontFace: fonts.body,
        color: palette.secondary, align: 'center'
      });
    }

    this.addSpeakerNotes(slideObj, slide.notes);
  }

  // ============ 辅助方法 ============

  private addSpeakerNotes(slide: any, notes: any): void {
    if (!notes) return;
    let script = '';
    if (typeof notes === 'string') {
      script = notes;
    } else if (notes.script) {
      script = notes.script;
    }
    if (script) {
      // 估算本张幻灯片的演讲时长
      const chineseChars = (script.match(/[\u4e00-\u9fa5]/g) || []).length;
      const isChinese = chineseChars / Math.max(script.length, 1) > 0.3;
      const duration = isChinese
        ? Math.round(script.length / 220 * 60) // 秒
        : Math.round(script.split(/\s+/).length / 140 * 60); // 秒

      const durationNote = `\n\n[Estimated duration: ${duration}s]`;
      slide.addNotes(script + durationNote);
    }
  }

  /**
   * 工具方法：估算文本朗读时长（秒）
   */
  static estimateSpeechDuration(text: string): number {
    if (!text) return 0;
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const isChinese = chineseChars / Math.max(text.length, 1) > 0.3;
    return isChinese
      ? Math.round(text.length / 220 * 60)
      : Math.round(text.split(/\s+/).length / 140 * 60);
  }

  private renderPageNumberOn(slide: any, current: number, total: number): void {
    const { palette, fonts } = this.template;

    // 左侧：页脚文字（公司名或自定义）
    if (this.brandOptions.showFooter) {
      const footerText = this.brandOptions.footerText ||
        this.brandOptions.company ||
        'ppt-robinji';
      slide.addText(footerText, {
        x: 0.3, y: 5.25, w: 5.0, h: 0.25,
        fontSize: 9, fontFace: fonts.body,
        color: palette.textSecondary, align: 'left', charSpacing: 1
      });
    }

    // 右侧：页码
    slide.addText(`${current} / ${total}`, {
      x: 8.8, y: 5.25, w: 1.0, h: 0.25,
      fontSize: 9, fontFace: fonts.body,
      color: palette.textSecondary, align: 'right'
    });
  }
}

export default PPTCreator;
