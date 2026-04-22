// 初始化配置

import * as dotenv from 'dotenv';

dotenv.config();

export async function initConfig() {
  const config = {
    claudeBaseUrl: process.env.CLAUDE_BASE_URL,
    claudeApiKey: process.env.CLAUDE_API_KEY,
    claudeModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
  };

  // 做一些基本的验证
  if (!config.claudeBaseUrl) {
    throw new Error('CLAUDE_BASE_URL is not defined in environment variables');
  }
  if (!config.claudeApiKey) {
    throw new Error('CLAUDE_API_KEY is not defined in environment variables');
  }
  return config;
}
