#!/usr/bin/env node

/**
 * 内容密度自适应测试
 * 验证 4 种密度等级（sparse / normal / dense / overflow）的渲染效果
 */

import { config } from 'dotenv';
import { existsSync, statSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import PPTCreator from '../src/pptx/creator.js';
import { analyzeContent, decideLayout, checkOverflow } from '../src/pptx/content-analyzer.js';
import type { PPTContent } from '../src/ai/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = join(__dirname, '../output');

config({ path: join(__dirname, '../.env'), quiet: true });

// 4 种密度场景的测试内容
const densityScenarios = {
  sparse: {
    title: '稀疏内容测试 - 1-2 个短要点',
    slides: [
      {
        title: '极简理念',
        type: 'content' as const,
        content: [
          'Less is more - 少即是多'
        ]
      },
      {
        title: '核心价值',
        type: 'content' as const,
        content: [
          '专注本质',
          '摒弃冗余'
        ]
      }
    ]
  },
  normal: {
    title: '标准内容测试 - 3-5 个中等要点',
    slides: [
      {
        title: '产品核心优势',
        type: 'content' as const,
        content: [
          '高性能：处理速度提升 3 倍',
          '易用性：5 分钟上手',
          '稳定性：99.99% 可用性',
          '扩展性：模块化设计'
        ]
      },
      {
        title: '应用场景',
        type: 'content' as const,
        content: [
          '企业内部协作',
          '客户关系管理',
          '数据分析与可视化',
          '工作流自动化'
        ]
      }
    ]
  },
  dense: {
    title: '密集内容测试 - 6-8 个要点',
    slides: [
      {
        title: '技术架构',
        type: 'content' as const,
        content: [
          '前端：React 18 + TypeScript + Vite',
          '后端：Node.js + Express + GraphQL',
          '数据库：PostgreSQL + Redis 缓存',
          '消息队列：Kafka + RabbitMQ',
          '容器化：Docker + Kubernetes',
          'CI/CD：GitHub Actions + ArgoCD',
          '监控：Prometheus + Grafana',
          '日志：ELK Stack'
        ]
      }
    ]
  },
  overflow: {
    title: '溢出内容测试 - 12+ 个要点或长文本',
    slides: [
      {
        title: '完整技术栈详解',
        type: 'content' as const,
        content: [
          'React 18 提供并发渲染能力，结合 Suspense 实现流式 SSR',
          'TypeScript 5.0 引入更严格的类型推断和装饰器标准',
          'Vite 5 使用 esbuild 预构建，启动速度比 Webpack 快 10 倍',
          'Node.js 22 LTS 内置 fetch、Test Runner 和 WebSocket 客户端',
          'Express 5 终于发布，支持 Promise 原生中间件和异步错误处理',
          'GraphQL 通过单一端点提供灵活查询，避免 REST 的过度获取',
          'PostgreSQL 16 增强逻辑复制和并行查询性能',
          'Redis 7 新增 Redis Functions 和多线程 I/O 优化',
          'Kafka 3.7 KRaft 模式完全替代 Zookeeper 简化部署',
          'Docker 25 优化 BuildKit 缓存策略提升镜像构建速度',
          'Kubernetes 1.30 引入 Sidecar 容器 GA 和结构化授权',
          'GitHub Actions 大幅提升 macOS runner 性能',
          'Prometheus 2.50 改进 WAL 压缩降低存储占用 40%'
        ]
      }
    ]
  }
};

async function analyzeDensities() {
  console.log('\n📊 内容密度分析');
  console.log('━'.repeat(80));

  for (const [scenario, data] of Object.entries(densityScenarios)) {
    for (const slide of data.slides) {
      const metrics = analyzeContent(slide.content);
      const layout = decideLayout(metrics, { titleSize: 32, bodySize: 18, captionSize: 12, title: 'Arial', body: 'Arial', mono: 'Consolas' });
      const check = checkOverflow(metrics, layout);

      console.log(`\n【${scenario}】${slide.title}`);
      console.log(`  要点数: ${metrics.itemCount} | 总字数: ${metrics.totalChars} | 平均: ${metrics.avgCharsPerItem}字/条 | 最长: ${metrics.maxChars}字`);
      console.log(`  → 密度: ${metrics.density} | 字号: ${layout.fontSize}pt | 间距: ${layout.itemSpacing}pt`);
      console.log(`  → 分栏: ${layout.columns}列 | 卡片: ${layout.useCardLayout ? '是' : '否'}`);
      if (check.warning) {
        console.log(`  ⚠️  ${check.warning}`);
      }
    }
  }
}

async function generatePPTs() {
  console.log('\n\n🎨 生成测试 PPT（每种密度场景一个）');
  console.log('━'.repeat(80));

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results: Array<{ scenario: string; path: string; size: number }> = [];

  for (const [scenario, data] of Object.entries(densityScenarios)) {
    const outputPath = join(OUTPUT_DIR, `density-${scenario}.pptx`);
    try {
      const creator = new PPTCreator({ template: 'business-classic', author: 'density-test' });
      await creator.createFromOutline(data);
      await creator.save(outputPath);
      const stats = statSync(outputPath);
      results.push({ scenario, path: outputPath, size: stats.size });
      console.log(`  ✅ [${scenario.padEnd(8)}] ${outputPath.split('/').pop()} (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (error) {
      console.log(`  ❌ [${scenario}] 失败: ${error}`);
    }
  }

  return results;
}

async function generateMixedPPT() {
  console.log('\n\n🌈 混合密度 PPT（模拟真实场景）');
  console.log('━'.repeat(80));

  const mixedContent: PPTContent = {
    title: '产品发布会',
    subtitle: '全新智能办公平台',
    slides: [
      // sparse - 标题页
      { title: '产品发布', type: 'content' as const, content: ['开启智能办公新时代'] },
      // normal - 3-4 个要点
      {
        title: '核心价值',
        type: 'content' as const,
        content: [
          'AI 驱动，效率提升 10 倍',
          '云端协同，团队无缝配合',
          '安全可靠，企业级数据保护',
          '灵活扩展，模块化定制'
        ]
      },
      // dense - 6-8 个技术要点
      {
        title: '技术亮点',
        type: 'content' as const,
        content: [
          '原生 AI 模型，无需训练即可使用',
          'WebAssembly 加速，关键路径提速 5 倍',
          'CRDT 协同算法，毫秒级同步延迟',
          '端到端加密，符合等保三级标准',
          '微服务架构，支持弹性伸缩',
          '多端一致，覆盖 8 大平台',
          '插件生态，200+ 官方扩展'
        ]
      },
      // overflow - 12+ 个详细技术点
      {
        title: '完整功能列表',
        type: 'content' as const,
        content: [
          '智能文档：AI 辅助写作、自动校对、多语言翻译',
          '表格协作：实时多人编辑、智能图表、数据透视',
          '演示制作：一键生成 PPT、智能配图、动画效果',
          '会议系统：高清音视频、AI 字幕、会议纪要自动生成',
          '任务管理：甘特图、看板视图、自动化工作流',
          '知识库：全文检索、智能推荐、知识图谱',
          'API 平台：OpenAPI 3.0、Webhook、SDK 多语言',
          '权限系统：RBAC、ABAC、字段级细粒度控制',
          '审计日志：完整操作记录、合规报告、异常告警',
          '集成中心：飞书、钉钉、企业微信、Slack、Teams',
          '移动办公：iOS/Android/HarmonyOS 原生体验',
          '离线模式：本地缓存、冲突解决、自动同步'
        ]
      }
    ]
  };

  const outputPath = join(OUTPUT_DIR, 'density-mixed-realistic.pptx');
  const creator = new PPTCreator({ template: 'tech-neon', author: 'density-test' });
  await creator.createFromOutline(mixedContent);
  await creator.save(outputPath);
  const stats = statSync(outputPath);
  console.log(`  ✅ 混合密度 PPT: ${outputPath.split('/').pop()} (${(stats.size / 1024).toFixed(1)} KB)`);
  console.log(`     包含: sparse(1) + normal(1) + dense(1) + overflow(1) 共 4 种密度场景`);
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      ppt-robinji 内容密度自适应测试                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  await analyzeDensities();
  await generatePPTs();
  await generateMixedPPT();

  console.log('\n\n✨ 测试完成！');
  console.log(`\n输出文件:`);
  console.log(`  📄 density-sparse.pptx     - 1-2 短要点（大字、留白）`);
  console.log(`  📄 density-normal.pptx     - 3-5 中等要点（标准布局）`);
  console.log(`  📄 density-dense.pptx      - 6-8 要点（紧凑排版）`);
  console.log(`  📄 density-overflow.pptx   - 12+ 要点/长文本（多列网格）`);
  console.log(`  📄 density-mixed-realistic.pptx - 真实场景混合（4 种密度）`);
}

main().catch(err => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
