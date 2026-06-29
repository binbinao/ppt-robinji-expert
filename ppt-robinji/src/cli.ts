#!/usr/bin/env node

// ppt-robinji CLI
// Usage: ppt-robinji <command> [options]

import { config } from 'dotenv';
import { Command } from 'commander';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import AIGenerator from './ai/generator.js';
import PPTCreator from './pptx/creator.js';
import ImageService from './image/image-service.js';
import Converter from './converter/index.js';
import { getAllImageProviders, getEnabledImageProviders } from './image/providers-config.js';
import { getAllProviders, getDefaultProvider } from './ai/providers.js';
import { ALL_TEMPLATES, getTemplatesByCategory } from './pptx/templates/index.js';
import { checkA11y } from './pptx/a11y-checker.js';
import { getTemplate } from './pptx/templates/index.js';

// 加载 .env
config();

// 工具函数：彩色输出
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const log = {
  info: (msg: string) => console.log(`${c.blue}ℹ${c.reset} ${msg}`),
  success: (msg: string) => console.log(`${c.green}✓${c.reset} ${msg}`),
  warn: (msg: string) => console.log(`${c.yellow}!${c.reset} ${msg}`),
  error: (msg: string) => console.log(`${c.red}✗${c.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${c.bright}${c.cyan}${msg}${c.reset}\n${c.gray}${'─'.repeat(60)}${c.reset}`)
};

// 程序入口
const program = new Command();

program
  .name('ppt-robinji')
  .description('Full-stack PPT skill - AI content + 14 slide types + 16 templates + 6 image sources')
  .version('1.0.0');

// ========================================================
// 1. generate - 生成 PPT
// ========================================================
program
  .command('generate')
  .alias('g')
  .description('Generate PPT using AI')
  .requiredOption('-t, --topic <topic>', 'PPT topic')
  .option('-s, --slides <number>', 'Number of slides', '8')
  .option('-p, --provider <id>', 'AI provider (deepseek, anthropic, openai, MiniMax, etc.)')
  .option('--template <id>', 'Template ID (business-classic, tech-neon, etc.)')
  .option('--structure <type>', 'Speech structure (ted, pitch, launch, tutorial, report)')
  .option('--style <style>', 'Style (professional, creative, minimal, persuasive)')
  .option('-o, --output <path>', 'Output file path', './output/presentation.pptx')
  .option('--image-provider <id>', 'Image provider (picsum, pollinations, unsplash, etc.)')
  .option('--no-images', 'Skip image generation')
  .option('--company <name>', 'Company/brand name')
  .option('--logo <text>', 'Logo text on cover')
  .option('--footer <text>', 'Footer text on every slide')
  .action(async (options) => {
    log.title('Generating PPT');
    log.info(`Topic: ${options.topic}`);
    log.info(`Slides: ${options.slides}`);

    const topic = options.topic;
    const slideCount = parseInt(options.slides);
    const outputPath = options.output;

    // 确保输出目录存在
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    try {
      // Step 1: AI 内容
      const generator = new AIGenerator(options.provider);
      log.info('Calling AI to generate content...');
      const content = await generator.generateOutline({
        topic,
        slides: slideCount,
        style: options.style,
        structure: options.structure
      });
      log.success(`Generated ${content.slides.length} slides`);
      if (content.estimatedDuration) {
        log.info(`Estimated duration: ${content.estimatedDuration} min`);
      }

      // Step 2: 图片
      if (options.images !== false && options.imageProvider) {
        const imgService = new ImageService(options.imageProvider);
        log.info(`Fetching images via ${options.imageProvider}...`);
        let count = 0;
        for (const slide of content.slides) {
          if (slide.imageQuery && !slide.imageUrl) {
            const img = await imgService.getOne({
              query: slide.imageQuery,
              width: 800,
              height: 600
            });
            if (img) {
              slide.imageUrl = img.url;
              count++;
            }
          }
        }
        log.success(`Added ${count} images`);
      }

      // Step 3: 创建 PPT
      const creator = new PPTCreator({
        template: options.template,
        author: 'ppt-robinji',
        company: options.company,
        logo: options.logo,
        footerText: options.footer,
        showFooter: !!(options.company || options.footer)
      });
      await creator.createFromOutline(content);
      await creator.save(outputPath);
      log.success(`PPT saved to: ${outputPath}`);

      // Step 4: A11y check
      const tpl = getTemplate(options.template || 'tech-neon');
      const a11y = checkA11y(content, tpl.palette);
      log.info(`A11y score: ${a11y.score}/100 - ${a11y.summary}`);
    } catch (error: any) {
      log.error(`Failed: ${error.message}`);
      process.exit(1);
    }
  });

// ========================================================
// 2. templates - 列出所有模板
// ========================================================
program
  .command('templates')
  .alias('t')
  .description('List all available templates')
  .option('-c, --category <name>', 'Filter by category')
  .action((options) => {
    log.title('Available Templates');
    const templates = options.category
      ? getTemplatesByCategory(options.category)
      : ALL_TEMPLATES;

    if (templates.length === 0) {
      log.warn(`No templates found for category: ${options.category}`);
      return;
    }

    for (const t of templates) {
      console.log(`  ${c.bright}${t.emoji} ${t.id.padEnd(25)}${c.reset} ${t.name}`);
      console.log(`     ${c.gray}${t.description}${c.reset}`);
    }
    console.log(`\n${c.dim}Total: ${templates.length} templates${c.reset}`);
  });

// ========================================================
// 3. providers - 列出 AI providers
// ========================================================
program
  .command('providers')
  .alias('p')
  .description('List all AI providers')
  .action(() => {
    log.title('AI Providers');
    const all = getAllProviders();
    const defaultId = getDefaultProvider();

    for (const { id, config: p } of all) {
      const isDefault = id === defaultId;
      const marker = isDefault ? c.green + '*' : ' ';
      const hasKey = !!process.env[p.apiKeyEnv];
      const status = p.enabled ? c.green + 'enabled' : c.gray + 'disabled';

      console.log(`  ${marker} ${c.bright}${id.padEnd(14)}${c.reset} ${p.name.padEnd(20)} ${status}${c.reset}`);
      console.log(`     ${c.gray}Model: ${p.defaultModel} | Type: ${p.type}${c.reset}`);
      console.log(`     ${c.gray}Key: ${hasKey ? c.green + p.apiKeyEnv + ' (set)' : c.yellow + p.apiKeyEnv + ' (missing)'}${c.reset}`);
    }
    console.log(`\n${c.dim}Default: ${defaultId}${c.reset}`);
  });

// ========================================================
// 4. image-providers - 列出图片源
// ========================================================
program
  .command('image-providers')
  .alias('ip')
  .description('List all image providers')
  .action(() => {
    log.title('Image Providers');
    const all = getAllImageProviders();

    for (const p of all) {
      const hasKey = !p.requiresKey || !!process.env[p.apiKeyEnv!];
      const status = p.enabled && hasKey ? c.green + 'ready' : c.yellow + 'needs setup';

      console.log(`  ${p.emoji} ${c.bright}${p.id.padEnd(15)}${c.reset} ${p.name.padEnd(20)} ${status}${c.reset}`);
      console.log(`     ${c.gray}${p.description}${c.reset}`);
    }
  });

// ========================================================
// 5. convert - 格式转换
// ========================================================
program
  .command('convert')
  .description('Convert PPT to PDF or images')
  .requiredOption('-i, --input <path>', 'Input PPTX file')
  .option('-t, --to <format>', 'Target format (pdf, images)', 'pdf')
  .option('-o, --output <path>', 'Output path/directory')
  .option('-r, --resolution <dpi>', 'Image resolution (for images)', '150')
  .action(async (options) => {
    log.title('Converting PPT');
    const converter = new Converter({ resolution: parseInt(options.resolution) });

    if (!existsSync(options.input)) {
      log.error(`Input file not found: ${options.input}`);
      process.exit(1);
    }

    try {
      if (options.to === 'pdf') {
        const outputPath = options.output || options.input.replace(/\.pptx$/, '.pdf');
        await converter.toPDF(options.input, outputPath);
        log.success(`PDF saved to: ${outputPath}`);
      } else if (options.to === 'images') {
        const outputDir = options.output || './output/images';
        const images = await converter.toImages(options.input, outputDir);
        log.success(`Generated ${images.length} images in: ${outputDir}`);
      } else {
        log.error(`Unknown format: ${options.to}`);
        process.exit(1);
      }
    } catch (error: any) {
      log.error(`Failed: ${error.message}`);
      process.exit(1);
    }
  });

// ========================================================
// 6. a11y - 无障碍检查
// ========================================================
program
  .command('a11y <input>')
  .description('Check accessibility of an existing PPT (basic)')
  .action(() => {
    log.title('A11y Check');
    log.warn('This is a content-only check. For full PPTX inspection, use the API.');
    log.info('See: checkA11y() in src/pptx/a11y-checker.ts');
  });

// 默认动作（无参数）
program.action(() => {
  program.help();
});

// ========================================================
// templates validate — Phase 1 新增（在 parseAsync 之前注册）
// ========================================================
import { TemplateSchema as _TemplateSchema } from './pptx/templates/index.js';
program
  .command('validate-templates')
  .description('Validate all templates against zod schema (Phase 1)')
  .action(() => {
    log.title('Template Validation');
    let pass = 0, fail = 0;
    for (const t of ALL_TEMPLATES) {
      const result = _TemplateSchema.safeParse(t);
      if (result.success) {
        log.success(`${t.id}`);
        pass++;
      } else {
        log.error(`${t.id}`);
        for (const issue of result.error.issues) {
          console.log(`     ${c.gray}${issue.path.join('.')}: ${issue.message}${c.reset}`);
        }
        fail++;
      }
    }
    console.log(`\n${c.dim}Total: ${pass} pass, ${fail} fail${c.reset}`);
    process.exit(fail > 0 ? 1 : 0);
  });

program.parseAsync(process.argv).catch(err => {
  log.error(err.message);
  process.exit(1);
});

