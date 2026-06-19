export {
  parseSVG,
  buildShapeXml,
  type ParsedShape,
  type SVGAttributes,
  type SVGElement,
  type SVGParseOptions,
} from './svg-parser.js';

export {
  star,
  arrow,
  heart,
  ring,
  ellipsePath,
  polygonFromPoints,
  fromSVGPath,
  type NativeShape,
  type Point,
  type FillOptions,
} from './native-shape.js';

export {
  injectXML,
  injectSmartArt,
  injectToAllSlides,
  type InjectOptions,
} from './raw-xml.js';
