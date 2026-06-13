---
name: ppt-robinji
description: "全栈演讲级 PPT 技能 - AI 生成专业级演讲内容、14 种专业幻灯片类型、16 套模板、6 大图片来源、内容密度自适应、品牌定制、演讲时长估算。当用户需要创建 PPT、制作演示文稿、生成幻灯片内容、AI 辅助写演讲大纲、PPT 转 PDF 或图片、TED 风格演讲、产品发布、投资者路演、教学课件时使用此技能。支持 10 个 AI 提供商 + 6 个图片源，基于 Node.js + pptxgenjs 技术栈。"
---

# ppt-robinji 演讲级 PPT 技能

## 概述

这是一个面向**专业演讲者**的全栈 PPT 技能，集成演讲方法论、AI 内容生成、视觉设计、内容密度自适应、品牌定制、图片服务等核心能力。

### 核心能力矩阵

| 能力 | 实现状态 |
|------|----------|
| AI 内容生成 | 10 个 provider，TED/Pitch/Launch/Tutorial/Report 5 种结构 |
| 幻灯片类型 | 14 种专业类型（cover/agenda/content/kpi/quote/comparison/process/timeline/divider/chart/conclusion/cta/qa/thank-you）|
| 视觉模板 | 16 套专业模板（10 大分类）|
| 内容密度自适应 | 4 级（sparse/normal/dense/overflow），自动字号+留白 |
| 图片服务 | 6 个来源（Picsum/Pollinations/Unsplash/Pexels/DALL-E/Stable Diffusion）|
| 品牌定制 | Logo/公司名/页脚/版权 |
| 演讲配套 | 时长估算、备注脚本、动画建议 |
| 格式转换 | PDF + 图片（需 LibreOffice）|

---

## 快速开始

### 1. 安装

```bash
cd ppt-robinji
npm install
```

### 2. 配置 API Key

复制 `.env.example` 为 `.env` 并填入至少一个 AI provider 的 key：

```bash
cp .env.example .env
# 编辑 .env，至少填入一个 API key
```

最少配置示例（推荐 DeepSeek，性价比高）：
```bash
DEEPSEEK_API_KEY=sk-your-key
PROVIDER=deepseek
```

可选配置（启用图片服务）：
```bash
UNSPLASH_ACCESS_KEY=your-key    # 启用 Unsplash 高质量摄影
PEXELS_API_KEY=your-key         # 启用 Pexels
OPENAI_API_KEY=sk-your-key      # 启用 DALL-E 3
```

### 3. 生成 PPT

```bash
# 命令行生成
npm run generate -- -t "你的主题" -s 8

# 测试 AI 功能
npm run test:ai -- "你的主题"

# 列出所有模板
npm run templates

# 列出所有 AI provider
npm run providers
```

---

## 核心使用方式

### 1. AI 生成演讲级 PPT

```typescript
import { AIGenerator } from './src/ai/generator.js';
import { PPTCreator } from './src/pptx/creator.js';
import { ImageService } from './src/image/image-service.js';

// Step 1: AI 生成内容（注入演讲方法论）
const generator = new AIGenerator();
const content = await generator.generateOutline({
  topic: 'Why AI Will Transform Education',
  slides: 10,
  style: 'persuasive',
  structure: 'ted',  // ted / pitch / launch / tutorial / report
  audience: 'investors',
  duration: 10
});

console.log(content.estimatedDuration);  // 自动估算的演讲时长

// Step 2: 添加图片
const imgService = new ImageService('pollinations');  // AI 生图，无需 key
for (const slide of content.slides) {
  if (slide.imageQuery) {
    const img = await imgService.getOne({ query: slide.imageQuery });
    if (img) slide.imageUrl = img.url;
  }
}

// Step 3: 创建 PPT（含品牌定制）
const creator = new PPTCreator({
  template: 'tech-neon',
  company: 'Robinji AI',
  logo: 'R',
  footerText: 'Robinji AI | robinji.com',
  showFooter: true
});
await creator.createFromOutline(content);
await creator.save('output.pptx');
```

### 2. 14 种幻灯片类型

| 类型 | 用途 | 关键字段 |
|------|------|----------|
| `cover` | 封面/钩子 | title (震撼数据), content[0] (副标题) |
| `agenda` | 目录 | content[] (4 大要点) |
| `content` | 标准要点 | content[] (3-5 个要点) |
| `kpi` | 数据卡片 | kpiValue, kpiUnit, kpiContext (巨字 96pt) |
| `quote` | 专家引用 | content[] (引用文字), quoteAuthor, quoteSource |
| `comparison` | 对比 | comparisonA, comparisonB (前后对比) |
| `process` | 流程步骤 | steps[] (每步 title + description) |
| `timeline` | 时间线 | events[] (date + title + description) |
| `divider` | 章节分隔 | title (章节名) |
| `chart` | 图表 | chartData { type, labels, values } |
| `conclusion` | 总结 | content[] (3-5 个要点) |
| `cta` | 行动号召 | content[0] (主行动), content[1] (链接/联系方式) |
| `qa` | 问答页 | - |
| `thank-you` | 致谢 | content[] (联系方式) |

### 3. 16 套专业模板

```bash
npm run templates  # 查看所有模板
```

| 分类 | 模板 | 风格 |
|------|------|------|
| 商务 | business-classic, business-elegant | 稳重专业 |
| 科技 | tech-neon, tech-circuit | 未来感 |
| 学术 | academic-classic | 严谨 |
| 创意 | creative-coral, creative-aurora | 大胆活泼 |
| 教育 | education-fresh | 友好 |
| 医疗 | medical-clean | 干净 |
| 金融 | finance-gold | 权威 |
| 极简 | minimal-charcoal, minimal-paper | 简洁 |
| 暗黑 | dark-midnight | 内敛 |
| 渐变 | gradient-ocean, gradient-sunset, gradient-forest | 视觉冲击 |

### 4. 5 种演讲结构

```typescript
// TED 风格（公开演讲）
{ structure: 'ted' }    // Hook → Agenda → Story → KPI → Process → CTA

// 投资人路演
{ structure: 'pitch' }   // Problem → Solution → Traction → Team → Ask

// 产品发布
{ structure: 'launch' }  // Pain → Demo → Features → Comparison → Pricing → CTA

// 教学课件
{ structure: 'tutorial' } // Goal → Steps → Common Mistakes → Q&A

// 商业报告
{ structure: 'report' }  // Headline → Highlights → Data → Analysis → Outlook
```

### 5. 6 个图片来源

```typescript
import { ImageService } from './src/image/image-service.js';

// 无需 key 的服务
const picsum = new ImageService('picsum');          // 随机图
const pollinations = new ImageService('pollinations'); // AI 生图（免费）

// 需要 key 的服务
const unsplash = new ImageService('unsplash');      // 高质量摄影
const pexels = new ImageService('pexels');          // 免版税图
const dalle = new ImageService('dalle');            // DALL-E 3
const sd = new ImageService('sd');                  // Stable Diffusion

// 使用
const img = await picsum.getOne({
  query: 'modern office',
  width: 800,
  height: 600,
  orientation: 'landscape'  // landscape | portrait | squarish
});
console.log(img.url);  // https://picsum.photos/seed/.../800/600
```

### 6. 品牌定制

```typescript
const creator = new PPTCreator({
  template: 'business-elegant',
  author: 'John Doe',
  company: 'Acme Corp',                    // 封面底部 + 每页页脚左侧
  logo: 'AC',                              // 封面顶部文字 Logo
  footerText: 'Confidential | Q1 2026',     // 自定义页脚
  showFooter: true,                        // 是否显示页脚
  layout: '16x9'                           // 16x9 | 16x10 | 4x3
});
```

### 7. 演讲时长估算

```typescript
const content = await generator.generateOutline({ topic, slides: 8 });
console.log(content.estimatedDuration);  // 分钟
console.log(content.totalScriptLength);   // 总字数
```

每张幻灯片备注末尾自动追加 `[Estimated duration: 60s]`。

### 8. 内容密度自适应

PPT 自动根据每页内容密度调整布局：

| 密度 | 触发条件 | 字号 | 列数 |
|------|----------|------|------|
| sparse | 1-2 条，总字数 < 50 | 24pt | 1 |
| normal | 3-5 条，总字数 50-200 | 18pt | 1 |
| dense | 6-8 条，总字数 200-400 | 16pt | 2 |
| overflow | 8+ 条或 >400 字 | 14pt | 2-3 |

---

## 5 种叙事结构 (Speech Methodology)

内置 TED 演讲教练方法论：

1. **The Hook**: 开场 30 秒震撼数据/反常识/故事
2. **Story Arc**: 起（背景）→ 承（冲突）→ 转（转折）→ 合（解决）
3. **One Idea Per Slide**: 每页只表达一个核心观点
4. **Numbers Are Heroes**: 关键 KPI 单独成页
5. **Social Proof**: 专家引用增加权威性
6. **The CTA**: 明确具体的行动号召

AI 自动遵循 10-20-30 法则（≤10 页、≤20 分钟、≥30pt 字号）。

---

## 10 个 AI Provider

| Provider | 模型 | 类型 | Key |
|----------|------|------|-----|
| deepseek | deepseek-v4-flash | OpenAI 兼容 | DEEPSEEK_API_KEY |
| anthropic | claude-sonnet-4-5 | Anthropic SDK | ANTHROPIC_API_KEY |
| openai | gpt-5 | OpenAI SDK | OPENAI_API_KEY |
| MiniMax | MiniMax-M3 | OpenAI 兼容 | MINIMAX_API_KEY |
| moonshot | kimi-k2.6 | OpenAI 兼容 | MOONSHOT_API_KEY |
| qwen | qwen3.5-plus | OpenAI 兼容 | DASHSCOPE_API_KEY |
| zhipu | glm-4.6 | OpenAI 兼容 | ZHIPU_API_KEY |
| openrouter | claude-sonnet-4.5 | OpenAI 兼容 | OPENROUTER_API_KEY |
| groq | llama-3.3-70b | OpenAI 兼容 | GROQ_API_KEY |
| ollama | llama3.3 | OpenAI 兼容 | (本地) |

切换：`PROVIDER=<id>` 或在代码中 `new AIGenerator('<id>')`

---

## 脚本命令

```bash
# 核心命令
npm run generate        # 生成 PPT (CLI)
npm run convert         # 格式转换
npm run providers       # 列出所有 AI provider
npm run templates       # 列出所有模板

# 测试命令
npm run test            # PPT 基础测试
npm run test:ai         # AI 生成测试
npm run test:mock       # Mock 内容测试（无需 key）
npm run test:templates  # 批量模板测试
npm run test:density    # 内容密度自适应测试
npm run test:images     # 图片服务测试
npm run test:v2         # 14 种 slide 类型测试
npm run test:p1         # 品牌定制 + 时长估算测试
npm run test:e2e        # 真实 AI 端到端测试
```

---

## 高级用法

### 自定义 Prompt（高级用户）

修改 `src/ai/speech-methodology.ts` 调整 AI 演讲方法论。

### 自定义模板

在 `src/pptx/templates/` 下新增 `your-category.ts`：

```typescript
import type { Template } from './types.js';

export const yourTemplates: Template[] = [{
  id: 'your-template',
  name: 'Your Template',
  description: '...',
  category: 'business',
  emoji: '...',
  palette: { /* colors */ },
  fonts: { /* font config */ },
  decoration: { /* visual style */ }
}];
```

然后在 `templates/index.ts` 引入即可。

### 部署到 CloudBase

```bash
cd cloudbase
npm install -g @cloudbase/cli
tcb login
tcb functions deploy ppt-generator
```

---

## 依赖

### 运行时
- Node.js 18+ (推荐 22+)
- 可选：LibreOffice（PDF/图片转换）

### npm 包
- `pptxgenjs` - PPT 生成
- `@anthropic-ai/sdk` - Claude API
- `openai` - OpenAI 兼容 API
- `sharp` - 图片处理
- `tsx` - TypeScript 运行时

---

## 故障排除

### API Key 错误
检查 `.env` 文件中的 key 格式：
- DeepSeek: `sk-...`
- Anthropic: `sk-ant-...`
- OpenAI: `sk-...`
- MiniMax: `eyJ...` (JWT 格式)

### 速率限制 (429)
TPM (Tokens Per Minute) 超限。等待 60 秒后重试，或减少 slides 数量。

### 图片加载失败
图片服务自动降级：Unsplash 失败 → Picsum，DALL-E 失败 → Pollinations

### 格式转换失败
需要安装 LibreOffice + poppler-utils：
- macOS: `brew install --cask libreoffice poppler`
- Ubuntu: `apt install libreoffice poppler-utils`

---

## 评分（v2.0）

- 技术架构：⭐⭐⭐⭐⭐
- 演讲专业度：⭐⭐⭐⭐⭐
- AI 集成：⭐⭐⭐⭐⭐
- 视觉设计：⭐⭐⭐⭐
- 易用性：⭐⭐⭐⭐
- 总评：9.0 / 10

---

## 路线图

- [x] P0：演讲方法论 + 14 种 slide 类型
- [x] P1：品牌定制 + 时长估算 + 端到端
- [ ] P2：A11y 无障碍 + 双语生成 + 动画
