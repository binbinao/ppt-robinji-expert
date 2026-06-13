import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    // 主入口
    index: 'src/index.ts',
    // CLI
    cli: 'src/cli.ts',
    // 子模块入口（用户可以从不同路径导入）
    'ai/index': 'src/ai/index.ts',
    'ai/generator': 'src/ai/generator.ts',
    'ai/providers': 'src/ai/providers.ts',
    'pptx/index': 'src/pptx/index.ts',
    'pptx/creator': 'src/pptx/creator.ts',
    'image/index': 'src/image/index.ts',
    'image/image-service': 'src/image/image-service.ts',
    'converter/index': 'src/converter/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: false,        // 跳过 DTS 生成（pptxgenjs 类型问题；用户用 JSDoc 推断）
  sourcemap: true,
  clean: true,
  shims: false,      // 不需要 shim
  splitting: false,  // 单文件打包，兼容更好
  minify: false,    // 保留可读性
  target: 'node18',
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' }
  },
  esbuildOptions(options) {
    options.platform = 'node'
  }
});
