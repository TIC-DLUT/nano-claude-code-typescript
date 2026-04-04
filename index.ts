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

// 使用call方法调用Claude API

async function test() {
  try {
    const response = await claude.call({
      model: 'claude-sonnet-4.6',
      messages: [
        { role: 'user', content: 'Hello, Claude!' },
      ],
      max_tokens: 100,
    });
    console.log('Claude API Response:', response);
  } catch (error) {
    console.error('Error calling Claude API:', error);
  }
}

test();