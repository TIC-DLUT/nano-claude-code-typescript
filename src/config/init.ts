import * as dotenv from 'dotenv';

let envLoaded = false;

export function loadEnv(): void {
  if (envLoaded) return;
  dotenv.config({ quiet: true }); //设置为 quiet 模式以避免在 .env 文件不存在时抛出错误，因为在某些环境中可能没有 .env 文件，例如生产环境。
  envLoaded = true;
}

export async function initConfig() {
  loadEnv();

  const config = {
    claudeBaseUrl: process.env.CLAUDE_BASE_URL,
    claudeApiKey: process.env.CLAUDE_API_KEY,
    claudeModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
  };

  if (!config.claudeBaseUrl) {
    throw new Error('CLAUDE_BASE_URL is not defined in environment variables');
  }
  if (!config.claudeApiKey) {
    throw new Error('CLAUDE_API_KEY is not defined in environment variables');
  }
  return config;
}
