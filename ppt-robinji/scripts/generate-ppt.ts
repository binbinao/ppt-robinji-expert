#!/usr/bin/env node

import { parseArgs } from 'util';
import { config } from 'dotenv';
import { generatePPT } from '../src/index.js';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// 加载环境变量
config();

interface Options {
  topic?: string;
  slides?: number;
  provider?: string;
  output?: string;
  style?: string;
  palette?: string;
  from?: string;
}

async function main() {
  const args = parseArgs({
    options: {
      topic: { type: 'string', short: 't' },
      slides: { type: 'string', short: 's' },
      provider: { type: 'string', short: 'p' },
      output: { type: 'string', short: 'o' },
      style: { type: 'string', short: 'st' },
      palette: { type: 'string', short: 'pl' },
      from: { type: 'string', short: 'f' },
      help: { type: 'boolean', short: 'h' }
    }
  });

  const options = args.values as Options;

  if (options.help || !options.topic) {
    console.log(`
ppt-robinji - AI生成PPT

用法: npm run generate -- [选项]

选项:
  -t, --topic <主题>      PPT主题（必需）
  -s, --slides <数量>    幻灯片数量（默认8）
  -p, --provider <提供商> AI提供商（anthropic/openai/deepseek）
  -o, --output <路径>    输出文件路径
  -st, --style <风格>    风格（professional/creative/minimal）
  -pl, --palette <配色>  配色方案
  -f, --from <文件>      源文档（PDF/DOCX/Markdown/TXT）
  -h, --help             显示帮助

示例:
  npm run generate -- --topic "人工智能在教育中的应用" --slides 10
  npm run generate -- -t "产品发布会" -o ./my-presentation.pptx -pl ocean-gradient
  npm run generate -- -t "季度报告" -f ./report.pdf -o q1.pptx
`);
    process.exit(options.help ? 0 : 1);
  }

  // 确保输出目录存在
  const outputPath = options.output || './output/presentation.pptx';
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  try {
    console.log(`🎨 Generating PPT for: ${options.topic}`);
    console.log(`📊 Slides: ${options.slides || (options.from ? '(auto)' : 8)}`);
    console.log(`🎭 Style: ${options.style || 'professional'}`);
    if (options.from) {
      console.log(`📄 Source: ${options.from}`);
    }

    const result = await generatePPT({
      topic: options.topic,
      slides: options.slides ? parseInt(options.slides.toString()) : undefined,
      provider: options.provider,
      outputPath: outputPath,
      style: options.style as any,
      palette: options.palette,
      from: options.from
    });

    console.log(`✅ PPT generated successfully: ${result}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
