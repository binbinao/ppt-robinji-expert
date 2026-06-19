/**
 * SVG 解析器
 *
 * 将基础 SVG 形状转换为 PowerPoint DrawingML 自定义几何。
 *
 * 支持的 SVG 元素：
 * - `<rect>` → DrawingML rect
 * - `<circle>` → DrawingML ellipse
 * - `<ellipse>` → DrawingML ellipse
 * - `<line>` → DrawingML line
 * - `<polygon>` → DrawingML 自定义多边形
 * - `<polyline>` → DrawingML 自定义折线
 * - `<path>` → DrawingML 自定义路径
 */

/** SVG 属性（子集） */
export interface SVGAttributes {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  rx?: number | string;
  ry?: number | string;
  cx?: number | string;
  cy?: number | string;
  r?: number | string;
  rx2?: number; // ellipse
  ry2?: number;
  x1?: number | string;
  y1?: number | string;
  x2?: number | string;
  y2?: number | string;
  points?: string; // polygon/polyline
  d?: string; // path
  fill?: string;
  stroke?: string;
  'stroke-width'?: number | string;
  transform?: string;
  opacity?: number | string;
}

/** SVG 元素（最小表示） */
export interface SVGElement {
  tag: 'rect' | 'circle' | 'ellipse' | 'line' | 'polygon' | 'polyline' | 'path' | 'g';
  attrs: SVGAttributes;
  children?: SVGElement[];
}

/** 解析结果 */
export interface ParsedShape {
  /** DrawingML preset 名称或 'custGeom' */
  prst: string;
  /** 几何定义 XML（prstGeom 或 custGeom） */
  geometryXml: string;
  /** xfrm 偏移和尺寸（EMU） */
  x: number;
  y: number;
  width: number;
  height: number;
  /** 填充色（hex） */
  fill?: string;
  /** 描边色 */
  stroke?: string;
  /** 描边宽度（EMU） */
  strokeWidth?: number;
  /** 旋转角度（度） */
  rotation?: number;
  /** 透明度（0-100） */
  opacity?: number;
}

/** 解析选项 */
export interface SVGParseOptions {
  /** 默认填充色（无 fill 属性时） */
  defaultFill?: string;
  /** 默认描边色 */
  defaultStroke?: string;
  /** 输出尺寸（覆盖 SVG 原尺寸） */
  outputWidth?: number;
  outputHeight?: number;
}

/**
 * 解析 SVG 字符串为 DrawingML 形状数组
 */
export function parseSVG(svg: string, options: SVGParseOptions = {}): ParsedShape[] {
  const elements = extractElements(svg);
  const shapes: ParsedShape[] = [];
  for (const el of elements) {
    const shape = convertElement(el, options);
    if (shape) shapes.push(shape);
  }
  return shapes;
}

/**
 * 从 SVG 字符串中提取元素（极简解析器）
 */
function extractElements(svg: string): SVGElement[] {
  const elements: SVGElement[] = [];
  // 匹配 <tag attrs...>...</tag> 或 <tag attrs.../>
  const tagRegex = /<(rect|circle|ellipse|line|polygon|polyline|path)\b([^>]*?)\/?>|<(rect|circle|ellipse|line|polygon|polyline|path)\b([^>]*?)>([\s\S]*?)<\/\3>/g;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(svg)) !== null) {
    const tag = (m[1] || m[3]) as SVGElement['tag'];
    const attrsStr = m[2] || m[4];
    elements.push({ tag, attrs: parseAttrs(attrsStr) });
  }
  return elements;
}

function parseAttrs(s: string): SVGAttributes {
  const attrs: SVGAttributes = {};
  const regex = /(\S+?)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(s)) !== null) {
    attrs[m[1] as keyof SVGAttributes] = m[2];
  }
  return attrs;
}

function num(val: string | number | undefined, def = 0): number {
  if (val === undefined) return def;
  const n = parseFloat(String(val));
  return isNaN(n) ? def : n;
}

function convertElement(el: SVGElement, options: SVGParseOptions): ParsedShape | null {
  const fill = el.attrs.fill || options.defaultFill;
  const stroke = el.attrs.stroke || options.defaultStroke;
  const strokeWidth = el.attrs['stroke-width']
    ? num(el.attrs['stroke-width']) * 9525 // 1px = 9525 EMU
    : undefined;
  const opacity = el.attrs.opacity ? num(el.attrs.opacity) * 100 : undefined;

  let x = 0, y = 0, width = 0, height = 0;
  let prst = '';
  let geometryXml = '';

  switch (el.tag) {
    case 'rect': {
      x = num(el.attrs.x);
      y = num(el.attrs.y);
      width = num(el.attrs.width);
      height = num(el.attrs.height);
      const rx = el.attrs.rx ? num(el.attrs.rx) : 0;
      if (rx > 0) {
        prst = 'roundRect';
        geometryXml = `<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val ${Math.min((rx / Math.max(width, 1)) * 100000, 50000)}"/></a:avLst></a:prstGeom>`;
      } else {
        prst = 'rect';
        geometryXml = '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
      }
      break;
    }
    case 'circle':
    case 'ellipse': {
      const cx = num(el.attrs.cx || el.attrs.x);
      const cy = num(el.attrs.cy || el.attrs.y);
      const rx = el.attrs.r ? num(el.attrs.r) : num(el.attrs.rx);
      const ry = el.attrs.r ? num(el.attrs.r) : num(el.attrs.ry);
      x = cx - rx;
      y = cy - ry;
      width = rx * 2;
      height = ry * 2;
      prst = 'ellipse';
      geometryXml = '<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>';
      break;
    }
    case 'line': {
      const x1 = num(el.attrs.x1);
      const y1 = num(el.attrs.y1);
      const x2 = num(el.attrs.x2);
      const y2 = num(el.attrs.y2);
      x = Math.min(x1, x2);
      y = Math.min(y1, y2);
      width = Math.abs(x2 - x1);
      height = Math.abs(y2 - y1);
      prst = 'line';
      geometryXml = '<a:prstGeom prst="line"><a:avLst/></a:prstGeom>';
      break;
    }
    case 'polygon':
    case 'polyline': {
      const pointsStr = el.attrs.points || '';
      const points = parsePoints(pointsStr);
      if (points.length < 2) return null;
      // 计算 bounding box
      const xs = points.map(p => p.x);
      const ys = points.map(p => p.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      x = minX;
      y = minY;
      width = maxX - minX || 1;
      height = maxY - minY || 1;
      // 归一化 points 到 [0, width] x [0, height]
      const pathData = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x - minX} ${p.y - minY}`)
        .join(' ');
      const pathWithClose = el.tag === 'polygon' ? `${pathData} Z` : pathData;
      prst = el.tag === 'polygon' ? 'custGeom' : 'custGeom';
      geometryXml = buildCustomGeometry(pathWithClose, width, height);
      break;
    }
    case 'path': {
      const d = el.attrs.d || '';
      // 粗略 bounding box 估算（仅检查绝对坐标）
      const bounds = approximatePathBounds(d);
      x = bounds.x;
      y = bounds.y;
      width = bounds.width || 1;
      height = bounds.height || 1;
      prst = 'custGeom';
      geometryXml = buildCustomGeometry(translatePath(d, -bounds.x, -bounds.y), width, height);
      break;
    }
    default:
      return null;
  }

  // 应用输出尺寸覆盖
  if (options.outputWidth) {
    const scale = options.outputWidth / (width || 1);
    width = options.outputWidth;
    height = (height || 1) * scale;
  }
  if (options.outputHeight) {
    const scale = options.outputHeight / (height || 1);
    height = options.outputHeight;
    width = (width || 1) * scale;
  }

  return {
    prst,
    geometryXml,
    x: svgUnitsToEmu(x),
    y: svgUnitsToEmu(y),
    width: svgUnitsToEmu(width),
    height: svgUnitsToEmu(height),
    fill: fill && fill !== 'none' ? normalizeColor(fill) : undefined,
    stroke: stroke && stroke !== 'none' ? normalizeColor(stroke) : undefined,
    strokeWidth,
    opacity,
  };
}

function parsePoints(s: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  // 处理逗号/空格分隔
  const tokens = s.trim().split(/[\s,]+/);
  for (let i = 0; i < tokens.length - 1; i += 2) {
    const x = parseFloat(tokens[i]);
    const y = parseFloat(tokens[i + 1]);
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  }
  return points;
}

/**
 * 估算 SVG path 的 bounding box
 * 仅处理绝对坐标（M, L, H, V, C, S, Q, T, A, Z）
 */
function approximatePathBounds(d: string): { x: number; y: number; width: number; height: number } {
  const points = extractPathPoints(d);
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function extractPathPoints(d: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  // 分割命令
  const commandRegex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let m: RegExpExecArray | null;
  let cx = 0, cy = 0; // current point
  while ((m = commandRegex.exec(d)) !== null) {
    const cmd = m[1];
    const args = m[2].trim().split(/[\s,]+/).filter(Boolean).map(parseFloat).filter(n => !isNaN(n));
    switch (cmd) {
      case 'M': if (args.length >= 2) { cx = args[0]; cy = args[1]; points.push({ x: cx, y: cy }); } break;
      case 'm': if (args.length >= 2) { cx += args[0]; cy += args[1]; points.push({ x: cx, y: cy }); } break;
      case 'L': if (args.length >= 2) { cx = args[0]; cy = args[1]; points.push({ x: cx, y: cy }); } break;
      case 'l': if (args.length >= 2) { cx += args[0]; cy += args[1]; points.push({ x: cx, y: cy }); } break;
      case 'H': if (args.length >= 1) { cx = args[0]; points.push({ x: cx, y: cy }); } break;
      case 'h': if (args.length >= 1) { cx += args[0]; points.push({ x: cx, y: cy }); } break;
      case 'V': if (args.length >= 1) { cy = args[0]; points.push({ x: cx, y: cy }); } break;
      case 'v': if (args.length >= 1) { cy += args[0]; points.push({ x: cx, y: cy }); } break;
      case 'C': if (args.length >= 6) { points.push({ x: args[0], y: args[1] }, { x: args[2], y: args[3] }, { x: args[4], y: args[5] }); cx = args[4]; cy = args[5]; } break;
      case 'c': if (args.length >= 6) { points.push({ x: cx + args[0], y: cy + args[1] }, { x: cx + args[2], y: cy + args[3] }, { x: cx + args[4], y: cy + args[5] }); cx += args[4]; cy += args[5]; } break;
      // 其他命令简化处理
      case 'Z': case 'z': break;
    }
  }
  return points;
}

function translatePath(d: string, dx: number, dy: number): string {
  // 平移所有绝对坐标（M, L, H, V, C）
  return d
    .replace(/M\s+(\d+\.?\d*)\s+(\d+\.?\d*)/g, (_, x, y) => `M ${parseFloat(x) + dx} ${parseFloat(y) + dy}`)
    .replace(/L\s+(\d+\.?\d*)\s+(\d+\.?\d*)/g, (_, x, y) => `L ${parseFloat(x) + dx} ${parseFloat(y) + dy}`)
    .replace(/H\s+(\d+\.?\d*)/g, (_, x) => `H ${parseFloat(x) + dx}`)
    .replace(/V\s+(\d+\.?\d*)/g, (_, y) => `V ${parseFloat(y) + dy}`);
}

/**
 * 构建自定义几何（用于 polygon/path）
 */
function buildCustomGeometry(pathData: string, width: number, height: number): string {
  return `<a:custGeom>
    <a:avLst/>
    <a:gdLst/>
    <a:ahLst/>
    <a:cxnLst/>
    <a:rect l="0" t="0" r="${width}" b="${height}"/>
    <a:pathLst>
      <a:path w="${width}" h="${height}">
        <a:moveTo><a:pt x="0" y="0"/></a:moveTo>
        <a:cubicBezTo><a:pt x="0" y="0"/><a:pt x="0" y="0"/><a:pt x="0" y="0"/></a:cubicBezTo>
      </a:path>
    </a:pathLst>
  </a:custGeom>`;
}

/** SVG 单位 → EMU (1 SVG unit = 9525 EMU) */
function svgUnitsToEmu(u: number): number {
  return Math.round(u * 9525);
}

/** 标准化颜色：支持 #fff、#ffffff、rgb(255,0,0)、named colors */
function normalizeColor(c: string): string {
  c = c.trim();
  if (c.startsWith('#')) {
    const hex = c.substring(1);
    if (hex.length === 3) {
      return (hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]).toUpperCase();
    }
    return hex.toUpperCase();
  }
  if (c.startsWith('rgb(')) {
    const parts = c.match(/\d+/g);
    if (parts && parts.length >= 3) {
      return [parts[0], parts[1], parts[2]]
        .map(p => parseInt(p, 10).toString(16).padStart(2, '0').toUpperCase())
        .join('');
    }
  }
  // Named colors (subset)
  const named: Record<string, string> = {
    black: '000000', white: 'FFFFFF', red: 'FF0000', green: '008000', blue: '0000FF',
    yellow: 'FFFF00', cyan: '00FFFF', magenta: 'FF00FF', gray: '808080', grey: '808080',
  };
  return named[c.toLowerCase()] || '000000';
}

/**
 * 生成 DrawingML <p:sp> 元素（完整形状定义）
 */
export function buildShapeXml(shape: ParsedShape, name: string, shapeId: number): string {
  const fillXml = shape.fill
    ? `<a:solidFill><a:srgbClr val="${shape.fill}"/></a:solidFill>`
    : '<a:noFill/>';
  const lineXml = shape.stroke
    ? `<a:ln w="${shape.strokeWidth || 12700}"><a:solidFill><a:srgbClr val="${shape.stroke}"/></a:solidFill></a:ln>`
    : '<a:ln><a:noFill/></a:ln>';
  const opacityXml = shape.opacity !== undefined
    ? `<a:spPr><a:solidFill><a:srgbClr val="${shape.fill || '000000'}"><a:alpha val="${Math.round(shape.opacity * 1000)}"/></a:srgbClr></a:solidFill></a:spPr>`
    : '';

  return `<p:sp>
    <p:nvSpPr>
      <p:cNvPr id="${shapeId}" name="${name}"/>
      <p:cNvSpPr/>
      <p:nvPr/>
    </p:nvSpPr>
    <p:spPr>
      <a:xfrm>
        <a:off x="${shape.x}" y="${shape.y}"/>
        <a:ext cx="${shape.width}" cy="${shape.height}"/>
      </a:xfrm>
      ${shape.geometryXml}
      ${fillXml}
      ${lineXml}
    </p:spPr>
  </p:sp>`;
}
