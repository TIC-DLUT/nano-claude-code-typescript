// 入口文件

import { initConfig } from './src/config/init.ts';
// 导入初始化配置函数
async function main() {
  const config = await initConfig();
  console.log('Initialized config:', config);
}

main();
