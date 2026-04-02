import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier'; // 这就是你说的显式冲突屏蔽

export default [
  // 1. 全局忽略 (必须独立成一个对象，且只能包含 ignores)
  {
    ignores: ['dist/**', 'node_modules/**', 'logs/**'],
  },

  // 2. 核心配置
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser, // 使用 TypeScript 解析器
      ecmaVersion: 'latest', // 使用最新的 ECMAScript 版本
      sourceType: 'module', // 允许使用 ES 模块
    },
    plugins: {
      '@typescript-eslint': tsPlugin, // 使用 TypeScript 插件
      prettier: prettierPlugin, // 使用 Prettier 插件
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'prettier/prettier': 'error', // 将 Prettier 规则作为错误处理
      '@typescript-eslint/no-explicit-any': 'warn', // 警告使用 any 类型，但不影响运行
    },
  },

  // 3. 显式声明冲突处理
  // 这行会关闭所有与 Prettier 冲突的 ESLint 规则
  prettierConfig,
];
