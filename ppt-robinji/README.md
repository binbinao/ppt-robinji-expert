# ppt-robinji

> Full-stack PPT skill - AI content generation, 14 slide types, 16 templates, 6 image sources, content-aware density, brand customization, and accessibility checks.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-green.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## Why ppt-robinji?

Building a professional presentation takes hours. **ppt-robinji** compresses this to minutes with:

- **AI-powered content** following TED/pitch/launch/tutorial/report structures
- **14 specialized slide types** (cover, agenda, KPI, quote, comparison, process, timeline, chart, CTA, etc.)
- **16 professional templates** across 10 categories
- **Content density adaptation** - auto-adjusts layout, font size, and whitespace based on content volume
- **6 image sources** including free AI generation (no API key needed)
- **Brand customization** - logo, company name, custom footer
- **Speaker notes** with estimated duration
- **Accessibility (A11y) checks** following WCAG AA standards

## Quick Start

### Install

```bash
npm install ppt-robinji
```

### CLI Usage

```bash
# List available AI providers
ppt-robinji providers

# List available templates
ppt-robinji templates

# Generate a PPT
ppt-robinji generate \
  --topic "Why AI Will Transform Education" \
  --slides 10 \
  --structure ted \
  --template tech-neon \
  --image-provider pollinations \
  --output ./my-talk.pptx
```

### Programmatic Usage

```typescript
import { AIGenerator, PPTCreator, ImageService } from 'ppt-robinji';

// 1. AI content generation
const generator = new AIGenerator();
const content = await generator.generateOutline({
  topic: 'How AI is Reshaping Work',
  slides: 10,
  structure: 'ted',
  style: 'persuasive'
});

console.log(content.estimatedDuration);  // Auto-calculated minutes

// 2. Add images
const imgService = new ImageService('pollinations');
for (const slide of content.slides) {
  if (slide.imageQuery) {
    const img = await imgService.getOne({ query: slide.imageQuery });
    if (img) slide.imageUrl = img.url;
  }
}

// 3. Create branded PPT
const creator = new PPTCreator({
  template: 'tech-neon',
  company: 'Robinji AI',
  logo: 'R',
  footerText: 'robinji.com',
  showFooter: true
});
await creator.createFromOutline(content);
await creator.save('output.pptx');
```

## Supported AI Providers

| Provider | Model | Type | API Key |
|----------|-------|------|---------|
| DeepSeek | deepseek-v4-flash | OpenAI-compatible | `DEEPSEEK_API_KEY` |
| Anthropic | claude-sonnet-4-5 | Anthropic SDK | `ANTHROPIC_API_KEY` |
| OpenAI | gpt-5 | OpenAI SDK | `OPENAI_API_KEY` |
| MiniMax | MiniMax-M3 | OpenAI-compatible | `MINIMAX_API_KEY` |
| Moonshot | kimi-k2.6 | OpenAI-compatible | `MOONSHOT_API_KEY` |
| Qwen | qwen3.5-plus | OpenAI-compatible | `DASHSCOPE_API_KEY` |
| Zhipu | glm-4.6 | OpenAI-compatible | `ZHIPU_API_KEY` |
| OpenRouter | claude-sonnet-4.5 | OpenAI-compatible | `OPENROUTER_API_KEY` |
| Groq | llama-3.3-70b | OpenAI-compatible | `GROQ_API_KEY` |
| Ollama | llama3.3 | OpenAI-compatible | (local) |

Set keys in `.env`:
```bash
DEEPSEEK_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PROVIDER=deepseek
```

## 14 Slide Types

| Type | Use Case | Key Fields |
|------|----------|-----------|
| `cover` | Opening / Hook | `title` (shocking stat), `content[0]` (subtitle) |
| `agenda` | Roadmap | `content[]` (4 key points) |
| `content` | Standard bullets | `content[]` (3-5 points) |
| `kpi` | Hero number | `kpiValue`, `kpiUnit`, `kpiContext` (96pt giant number) |
| `quote` | Expert citation | `content[]`, `quoteAuthor`, `quoteSource` |
| `comparison` | Before/After | `comparisonA`, `comparisonB` |
| `process` | Sequential steps | `steps[]` |
| `timeline` | Chronological events | `events[]` |
| `divider` | Section break | `title` (section name) |
| `chart` | Data visualization | `chartData { type, labels, values }` |
| `conclusion` | Key takeaways | `content[]` (3-5 points) |
| `cta` | Call-to-action | `content[0]`, `content[1]` (link/contact) |
| `qa` | Q&A invitation | - |
| `thank-you` | Closing | `content[]` (contact info) |

## 16 Templates

| Category | Templates |
|----------|-----------|
| Business | business-classic, business-elegant |
| Tech | tech-neon, tech-circuit |
| Academic | academic-classic |
| Creative | creative-coral, creative-aurora |
| Education | education-fresh |
| Medical | medical-clean |
| Finance | finance-gold |
| Minimal | minimal-charcoal, minimal-paper |
| Dark | dark-midnight |
| Gradient | gradient-ocean, gradient-sunset, gradient-forest |

View all:
```bash
ppt-robinji templates
ppt-robinji templates --category tech
```

## Content Density Adaptation

Each slide automatically adapts to its content density:

| Density | Trigger | Font Size | Columns |
|---------|---------|-----------|---------|
| `sparse` | 1-2 points, < 50 chars | 24pt | 1 |
| `normal` | 3-5 points, 50-200 chars | 18pt | 1 |
| `dense` | 6-8 points, 200-400 chars | 16pt | 2 |
| `overflow` | 8+ points or > 400 chars | 14pt | 2-3 |

No configuration needed - it just works.

## 6 Image Sources

| Source | Type | API Key | Cost |
|--------|------|---------|------|
| Picsum | Random | None | Free |
| Pollinations | AI Generation | None | Free |
| Unsplash | Search | `UNSPLASH_ACCESS_KEY` | Free tier |
| Pexels | Search | `PEXELS_API_KEY` | Free tier |
| DALL-E 3 | AI Generation | `OPENAI_API_KEY` | Paid |
| Stable Diffusion | AI Generation | `STABILITY_API_KEY` | Paid |

```typescript
const picsum = new ImageService('picsum');
const img = await picsum.getOne({ query: 'modern office', width: 800, height: 600 });
// => https://picsum.photos/seed/.../800/600
```

## 5 Speech Structures

The AI prompt is enhanced with TED-style methodology:

| Structure | Best For | Pattern |
|-----------|----------|---------|
| `ted` | Public talks | Hook → Agenda → Story → KPI → Process → CTA |
| `pitch` | Investor decks | Problem → Solution → Traction → Team → Ask |
| `launch` | Product launches | Pain → Demo → Features → Comparison → Pricing |
| `tutorial` | How-to guides | Goal → Steps → Mistakes → Q&A |
| `report` | Business reports | Headline → Highlights → Data → Analysis → Outlook |

```typescript
const content = await generator.generateOutline({
  topic: '...',
  structure: 'pitch',  // Auto-generates appropriate slide types
  duration: 15
});
```

## Brand Customization

```typescript
const creator = new PPTCreator({
  template: 'business-elegant',
  author: 'John Doe',
  company: 'Acme Corp',           // Cover bottom + footer left
  logo: 'AC',                     // Cover top
  footerText: 'Confidential',     // Custom footer
  showFooter: true
});
```

## A11y Accessibility Check

```typescript
import { checkA11y } from 'ppt-robinji/pptx/a11y-checker';

const report = checkA11y(content, palette);
console.log(report.score);           // 0-100
console.log(report.summary);        // Human-readable
console.log(report.issues);         // Detailed issues
```

Checks:
- **Contrast ratio** (WCAG AA: 4.5:1, AAA: 7:1)
- **Content length** (3-5 bullets per slide)
- **Font size** (titles < 60 chars)
- **Bullet point length** (under 80 chars)

CLI check:
```bash
ppt-robinji a11y <file>
```

## API Reference

### `AIGenerator`
- `new AIGenerator(provider?)` - Create generator (defaults to env PROVIDER)
- `.generateOutline(options)` - Generate content
  - `topic: string`
  - `slides?: number` (default: 8)
  - `style?: 'professional' | 'creative' | 'minimal' | 'persuasive'`
  - `structure?: 'ted' | 'pitch' | 'launch' | 'tutorial' | 'report'`
  - `audience?: string`
  - `duration?: number` (minutes)

### `PPTCreator`
- `new PPTCreator(options)` - Create builder
  - `template?: string` (template ID)
  - `company?: string`
  - `logo?: string`
  - `footerText?: string`
  - `showFooter?: boolean`
- `.createFromOutline(content)` - Build from content
- `.save(path)` - Save to file
- `.getTemplate()` - Get current template
- `.getPresentation()` - Get raw pptxgenjs instance

### `ImageService`
- `new ImageService(provider?)` - Create service
- `.search(options)` - Get multiple images
- `.getOne(options)` - Get single image
  - `query: string`
  - `width?: number`
  - `height?: number`
  - `orientation?: 'landscape' | 'portrait' | 'squarish'`
  - `style?: string` (for AI generation)

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `PROVIDER` | Default AI provider | No |
| `ANTHROPIC_API_KEY` | Anthropic Claude | If using Anthropic |
| `OPENAI_API_KEY` | OpenAI / DALL-E 3 | If using OpenAI/DALL-E |
| `DEEPSEEK_API_KEY` | DeepSeek | If using DeepSeek |
| `MINIMAX_API_KEY` | MiniMax | If using MiniMax |
| `MOONSHOT_API_KEY` | Moonshot | If using Moonshot |
| `DASHSCOPE_API_KEY` | Qwen | If using Qwen |
| `ZHIPU_API_KEY` | Zhipu GLM | If using Zhipu |
| `OPENROUTER_API_KEY` | OpenRouter | If using OpenRouter |
| `GROQ_API_KEY` | Groq | If using Groq |
| `UNSPLASH_ACCESS_KEY` | Unsplash | If using Unsplash |
| `PEXELS_API_KEY` | Pexels | If using Pexels |
| `STABILITY_API_KEY` | Stability AI | If using SD |

## Programmatic Examples

### Generate and save to file
```typescript
import { AIGenerator, PPTCreator } from 'ppt-robinji';

const generator = new AIGenerator();
const content = await generator.generateOutline({
  topic: 'Climate Tech 2026',
  slides: 12,
  structure: 'report'
});

const creator = new PPTCreator({ template: 'gradient-ocean' });
await creator.createFromOutline(content);
await creator.save('climate-tech-2026.pptx');
```

### Just generate content (no PPT)
```typescript
import { AIGenerator } from 'ppt-robinji/ai';

const generator = new AIGenerator('anthropic');
const content = await generator.generateOutline({ topic: 'My Talk' });
console.log(JSON.stringify(content, null, 2));
```

### Custom slide with image
```typescript
const creator = new PPTCreator({ template: 'tech-neon' });

const customSlide: SlideContent = {
  title: 'Our Vision',
  type: 'cover',
  content: ['Building the future, today'],
  imageQuery: 'futuristic city skyline',
  imagePosition: 'right'
};

const content = {
  title: 'Custom PPT',
  slides: [customSlide, /* ... */]
};

await creator.createFromOutline(content);
await creator.save('output.pptx');
```

## Project Structure

```
ppt-robinji/
├── src/
│   ├── index.ts              # Main entry
│   ├── cli.ts                # CLI entry
│   ├── ai/                   # AI content generation
│   │   ├── speech-methodology.ts
│   │   ├── generator.ts
│   │   ├── providers.ts
│   │   └── index.ts
│   ├── pptx/                 # PPT creation
│   │   ├── creator.ts        # 14 slide renderers
│   │   ├── content-analyzer.ts
│   │   ├── a11y-checker.ts
│   │   ├── templates/        # 16 templates
│   │   └── index.ts
│   ├── image/                # Image services
│   │   ├── image-service.ts
│   │   ├── providers-config.ts
│   │   └── index.ts
│   ├── converter/            # PPT to PDF/images
│   └── utils/
├── scripts/                  # Test scripts (dev only)
├── config/providers.json     # Provider config
├── dist/                     # Built output (generated)
├── SKILL.md                  # CodeBuddy skill definition
├── README.md                 # This file
├── LICENSE                   # MIT
├── package.json
├── tsup.config.ts
└── .npmignore
```

## Development

```bash
git clone <repo>
cd ppt-robinji
npm install

# Run tests
npm run test          # PPT basic
npm run test:ai       # AI generation
npm run test:mock     # No-key tests
npm run demo          # All features

# Build for production
npm run build

# Test CLI locally
node dist/cli.js --help
```

## License

MIT - see [LICENSE](LICENSE) file.

## Contributing

Issues and PRs welcome at the GitHub repo.

## Related

- [pptxgenjs](https://github.com/gitbrent/PptxGenJS) - Underlying PPT library
- [OpenAI SDK](https://github.com/openai/openai-node) - Used for OpenAI-compatible providers
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) - Claude API
