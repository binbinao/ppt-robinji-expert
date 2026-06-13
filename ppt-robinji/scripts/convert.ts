#!/usr/bin/env node

import { parseArgs } from 'util';
import { config } from 'dotenv';
import { convertPPT } from '../src/index.js';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// 加载环境变量
config();

interface Options {
  input?: string;
  to?: string;
  output?: string;
  resolution?: string;
  help?: boolean;
}

async function main() {
  const args = parseArgs({
    options: {
      input: { type: 'string', short: 'i' },
      to: { type: 'string', short: 't' },
      output: { type: 'string', short: 'o' },
      resolution: { type: 'string', short: 'r' },
      help: { type: 'boolean', short: 'h' }
    }
  });

  const options = args.values as Options;

  if (options.help || !options.input) {
    console.log(`
ppt-robinji - PPT格式转换

用法: npm run convert -- [选项]

选项:
  -i, --input <路径>    输入PPT文件（必需）
  -t, --to <格式>       目标格式（pdf/images）
  -o, --output <路径>   输出路径
  -r, --resolution <DPI> 图片分辨率（默认150）
  -h, --help           显示帮助

示例:
  npm run convert -- --input presentation.pptx --to pdf
  npm run convert -- -i presentation.pptx -t images -o ./slides/
`);
    process.exit(options.help ? 0 : 1);
  }

  if (!existsSync(options.input)) {
    console.error(`❌ Input file not found: ${options.input}`);
    process.exit(1);
  }

  const to = options.to || 'pdf';
  if (to !== 'pdf' && to !== 'images') {
    console.error('❌ Invalid format. Use "pdf" or "images"');
    process.exit(1);
  }

  // 确定输出路径
  let outputPath = options.output;
  if (!outputPath) {
    if (to === 'pdf') {
      outputPath = options.input.replace(/\.pptx$/, '.pdf');
    } else {
      outputPath = options.input.replace(/\.pptx$/, '') + '-images';
    }
  }

  // 确保输出目录存在
  const dir = to === 'pdf' ? dirname(outputPath) : outputPath;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  try {
    console.log(`📄 Converting: ${options.input}`);
    console.log(`🎯 Target: ${to}`);
    console.log(`📁 Output: ${outputPath}`);

    const result = await convertPPT({
      inputPath: options.input,
      outputPath: outputPath,
      to: to as 'pdf' | 'images',
      resolution: options.resolution ? parseInt(options.resolution) : undefined
    });

    console.log(`✅ Conversion completed: ${result}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
