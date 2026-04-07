import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 启用全局变量
    globals: true,
    // 使用node环境进行测试
    environment: 'node',
    // 包含测试文件的模式
    include: ['test/**/*.test.ts', 'test/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    // 排除测试文件的模式
    exclude: ['**/node_modules/**', '**/dist/**'],
    // 覆盖率配置
    coverage: {
      // 使用 v8 作为覆盖率提供者，性能更好
      provider: 'v8',
      // 生成覆盖率报告
      reporter: ['text', 'json', 'html'],
      // 排除测试文件和配置文件
      // 只包含 src 目录下的 TypeScript 文件
      include: ['src/**/*.ts'],
      exclude: [
        'test/**',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        'vitest.config.ts',
      ],
    },
    // 运行每个测试前自动恢复所有模拟的函数和模块
    restoreMocks: true,
    clearMocks: true, // 运行测试前自动清除所有模拟的函数和模块
  },
});
