//入口文件
import * as dotenv from 'dotenv';

dotenv.config();

// 导入 ClaudeClient 类
import { ClaudeClient } from './src/client.ts';

// 从环境变量中获取 Claude API 的基础 URL 和 API 密钥
const baseURL = process.env.CLAUDE_BASE_URL;
const apiKey = process.env.CLAUDE_API_KEY;

// 创建 ClaudeClient 实例

const claude = ClaudeClient.newClaudeClient(baseURL, apiKey);

// 发起一个简单的请求，获取 Claude 的版本信息

claude.httpClient
  .get(`${claude.baseURL}/version`, {
    Authorization: `Bearer ${claude.apiKey}`,
  })
  .then((data) => {
    console.log('Claude version:', data.version);
  })
  .catch((error) => {
    console.error('Error fetching Claude version:', error);
  });
