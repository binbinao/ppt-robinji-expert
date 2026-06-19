/**
 * 动画类型定义
 *
 * PowerPoint OOXML 动画系统很复杂，本模块抽象出常用动画/过渡 API。
 * 通过后处理 .pptx 文件，向 slide XML 注入 <p:transition> 和 <p:timing> 节点。
 */

/** 支持的过渡效果 */
export type TransitionType =
  | 'none'
  | 'fade'         // 淡入淡出
  | 'push'         // 推入
  | 'wipe'         // 揭开
  | 'cover'        // 覆盖
  | 'cut'          // 剪切
  | 'random'       // 随机
  | 'split'        // 分裂
  | 'reveal'       // 显示
  | 'circle'       // 圆形
  | 'diamond'      // 菱形
  | 'plus'         // 加号
  | 'wedge'        // 楔形
  | 'zoom'         // 缩放
  | 'honeycomb'    // 蜂窝
  | 'flash'        // 闪烁
  | 'vortex'       // 漩涡
  | 'ripple'       // 波纹
  | 'glitter'      // 闪光
  | 'newsflash'    // 闪烁新闻
  | 'fall'         // 下降
  | 'drape'        // 帷幕
  | 'curtains'     // 幕布
  | 'wind'         // 风吹
  | 'prestige'     // 威望
  | 'fracture'     // 破碎
  | 'crush'        // 压碎
  | 'peeloff'      // 撕下
  | 'pageturn'     // 翻页
  | 'pan';         // 平移

/** 过渡效果配置 */
export interface TransitionOptions {
  type: TransitionType;
  /** 过渡时长（毫秒），默认 700 */
  duration?: number;
  /** 过渡方向（仅部分类型有效） */
  direction?: 'l' | 'r' | 'u' | 'd';
}

/** 支持的形状动画 */
export type ShapeAnimationType =
  | 'fade'         // 淡入
  | 'float'        // 浮入
  | 'scale'        // 缩放
  | 'slide'        // 滑入
  | 'bounce'       // 弹跳
  | 'rotate'       // 旋转
  | 'grow'         // 放大
  | 'shrink'       // 缩小
  | 'appear'       // 出现
  | 'dissolve';    // 溶解

/** 形状动画触发方式 */
export type AnimationTrigger = 'click' | 'auto';

/** 形状动画配置 */
export interface ShapeAnimation {
  type: ShapeAnimationType;
  trigger: AnimationTrigger;
  /** 延迟（毫秒），仅 auto 模式有效 */
  delay?: number;
  /** 动画时长（毫秒），默认 500 */
  duration?: number;
  /** 方向（仅部分类型有效） */
  direction?: 'l' | 'r' | 'u' | 'd';
}

/** 每页动画配置 */
export interface SlideAnimationConfig {
  /** 过渡效果 */
  transition?: TransitionOptions;
  /** 形状动画列表 */
  shapeAnimations?: ShapeAnimation[];
}

/** 整体 PPT 动画配置 */
export interface PresentationAnimationConfig {
  /** 全部页面使用统一过渡 */
  defaultTransition?: TransitionOptions;
  /** 哪些 slide 类型自动启用过渡（默认 ['cover', 'agenda', 'conclusion', 'cta']）*/
  autoTransitionTypes?: string[];
  /** 是否启用形状动画 */
  enableShapeAnimations?: boolean;
}
