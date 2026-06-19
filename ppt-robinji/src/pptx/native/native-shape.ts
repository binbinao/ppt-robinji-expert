/**
 * 原生自定义形状构建器
 *
 * 通过编程方式生成 PowerPoint DrawingML 自定义几何（custGeom）。
 * 比 preset 形状更灵活，可生成星形、箭头、多边形等。
 *
 * 底层使用 <a:custGeom> + <a:pathLst> 自定义路径
 */

export interface Point {
  x: number;
  y: number;
}

export interface NativeShape {
  /** 形状的 SVG 路径（用于渲染和导出） */
  svgPath: string;
  /** 形状的 bounding box */
  width: number;
  height: number;
  /** DrawingML 自定义几何 XML */
  geometryXml: string;
}

/** 选项：填充色 */
export interface FillOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number; // EMU
}

/**
 * 生成 5 角星
 */
export function star(options: {
  outerRadius: number;
  innerRadius: number;
  points?: number;
  cx?: number;
  cy?: number;
} = { outerRadius: 1, innerRadius: 0.4 }): NativeShape {
  const { outerRadius, innerRadius, points = 5, cx = 0, cy = 0 } = options;
  const totalPoints = points * 2;
  const path: Point[] = [];
  for (let i = 0; i < totalPoints; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    path.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }
  return polygonFromPoints(path, outerRadius * 2, outerRadius * 2);
}

/** 通用多边形（闭合） */
export function polygonFromPoints(points: Point[], width: number, height: number): NativeShape {
  const svgPath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(3)} ${p.y.toFixed(3)}`
  ).join(' ') + ' Z';
  return {
    svgPath,
    width,
    height,
    geometryXml: buildCustGeomFromPath(svgPath, width, height),
  };
}

/** 箭头（朝右） */
export function arrow(options: {
  width?: number;
  height?: number;
  headSize?: number;
} = {}): NativeShape {
  const { width = 2, height = 1, headSize = 0.4 } = options;
  const points: Point[] = [
    { x: 0, y: height / 2 - headSize / 2 },
    { x: width - headSize, y: height / 2 - headSize / 2 },
    { x: width - headSize, y: 0 },
    { x: width, y: height / 2 },
    { x: width - headSize, y: height },
    { x: width - headSize, y: height / 2 + headSize / 2 },
    { x: 0, y: height / 2 + headSize / 2 },
  ];
  return polygonFromPoints(points, width, height);
}

/** 心形 */
export function heart(options: { width?: number; height?: number } = {}): NativeShape {
  const { width = 1, height = 1 } = options;
  // 简化：使用 path
  const path = `M ${width / 2} ${height * 0.8}
                C ${width * 0.1} ${height * 0.5}, ${width * 0.0} ${height * 0.2}, ${width * 0.3} ${height * 0.2}
                C ${width * 0.45} ${height * 0.2}, ${width / 2} ${height * 0.4}, ${width / 2} ${height * 0.4}
                C ${width / 2} ${height * 0.4}, ${width * 0.55} ${height * 0.2}, ${width * 0.7} ${height * 0.2}
                C ${width} ${height * 0.2}, ${width * 0.9} ${height * 0.5}, ${width / 2} ${height * 0.8} Z`;
  return {
    svgPath: path,
    width,
    height,
    geometryXml: buildCustGeomFromPath(path, width, height),
  };
}

/** 圆环（甜甜圈） */
export function ring(options: { outerRadius: number; innerRadius: number } = { outerRadius: 1, innerRadius: 0.5 }): NativeShape {
  const { outerRadius, innerRadius } = options;
  const cx = outerRadius, cy = outerRadius;
  // 简化：用两个椭圆并排（不完美但可用）
  // 实际用 path 构建复合形状
  const w = outerRadius * 2, h = outerRadius * 2;
  // 外圆 + 内圆
  const outer = `M ${cx - outerRadius} ${cy}
                 A ${outerRadius} ${outerRadius} 0 1 0 ${cx + outerRadius} ${cy}
                 A ${outerRadius} ${outerRadius} 0 1 0 ${cx - outerRadius} ${cy} Z
                 M ${cx - innerRadius} ${cy}
                 A ${innerRadius} ${innerRadius} 0 1 1 ${cx + innerRadius} ${cy}
                 A ${innerRadius} ${innerRadius} 0 1 1 ${cx - innerRadius} ${cy} Z`;
  return {
    svgPath: outer,
    width: w,
    height: h,
    geometryXml: buildCustGeomFromPath(outer, w, h, true), // even-odd fill rule
  };
}

/** 椭圆（用贝塞尔近似） */
export function ellipsePath(options: { rx: number; ry: number } = { rx: 1, ry: 1 }): NativeShape {
  const { rx, ry } = options;
  const k = 0.5522847498; // bezier circle approximation
  const ox = rx * k, oy = ry * k;
  const path = `M ${rx} 0
                C ${rx} ${oy} ${ox} ${ry} 0 ${ry}
                C ${-ox} ${ry} ${-rx} ${oy} ${-rx} 0
                C ${-rx} ${-oy} ${-ox} ${-ry} 0 ${-ry}
                C ${ox} ${-ry} ${rx} ${-oy} ${rx} 0 Z`;
  return {
    svgPath: path,
    width: rx * 2,
    height: ry * 2,
    geometryXml: buildCustGeomFromPath(path, rx * 2, ry * 2),
  };
}

/**
 * 从 SVG path 构建 custGeom XML
 */
function buildCustGeomFromPath(
  svgPath: string,
  width: number,
  height: number,
  evenOdd: boolean = false
): string {
  // 将 SVG path 转换为 DrawingML path 列表
  const pathCommands = parseSVGPath(svgPath);
  const pathXml = pathCommands.map(cmd => svgCmdToXml(cmd)).join('');

  return `<a:custGeom>
    <a:avLst/>
    <a:gdLst/>
    <a:ahLst/>
    <a:cxnLst/>
    <a:rect l="0" t="0" r="${width}" b="${height}"/>
    <a:pathLst>
      <a:path w="${width}" h="${height}" ${evenOdd ? 'fill="evenOdd"' : ''}>
        ${pathXml}
      </a:path>
    </a:pathLst>
  </a:custGeom>`;
}

type SVGCommand = {
  type: 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z';
  points: number[]; // 命令所需的点
};

function parseSVGPath(d: string): SVGCommand[] {
  const cmds: SVGCommand[] = [];
  const regex = /([MmLlCcQqAaZz])([^MmLlCcQqAaZz]*)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(d)) !== null) {
    const cmd = m[1].toUpperCase() as SVGCommand['type'];
    const args = m[2].trim().split(/[\s,]+/).filter(Boolean).map(parseFloat);
    if (cmd === 'Z') {
      cmds.push({ type: 'Z', points: [] });
    } else {
      cmds.push({ type: cmd, points: args });
    }
  }
  return cmds;
}

function svgCmdToXml(cmd: SVGCommand): string {
  const { type, points: p } = cmd;
  switch (type) {
    case 'M':
      return `<a:moveTo><a:pt x="${p[0]}" y="${p[1]}"/></a:moveTo>`;
    case 'L':
      return `<a:lnTo><a:pt x="${p[0]}" y="${p[1]}"/></a:lnTo>`;
    case 'C':
      return `<a:cubicBezTo>
        <a:pt x="${p[0]}" y="${p[1]}"/>
        <a:pt x="${p[2]}" y="${p[3]}"/>
        <a:pt x="${p[4]}" y="${p[5]}"/>
      </a:cubicBezTo>`;
    case 'Q':
      return `<a:quadBezTo>
        <a:pt x="${p[0]}" y="${p[1]}"/>
        <a:pt x="${p[2]}" y="${p[3]}"/>
      </a:quadBezTo>`;
    case 'A':
      // 简化为直线（弧形精确转换复杂）
      return `<a:lnTo><a:pt x="${p[5]}" y="${p[6]}"/></a:lnTo>`;
    case 'Z':
      return '<a:close/>';
    default:
      return '';
  }
}

/**
 * 工具：从 SVG path 字符串生成 DrawingML 形状描述
 */
export function fromSVGPath(svgPath: string, width: number, height: number): NativeShape {
  return {
    svgPath,
    width,
    height,
    geometryXml: buildCustGeomFromPath(svgPath, width, height),
  };
}
