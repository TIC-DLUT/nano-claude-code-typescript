// 测试baseurl和apikey是否有效
import * as dotenv from 'dotenv';

dotenv.config();

import { describe, it, expect } from 'vitest';
import { ClaudeClient } from '../src/llm/client.ts';

describe('ClaudeClient', () => {
  it('should call Claude API and return response text', async () => {
    const client = ClaudeClient.newClaudeClient(
      process.env.CLAUDE_BASE_URL as string,
      process.env.CLAUDE_API_KEY as string,
    );
    const response = await client.callStream(
      {
        model: 'claude-sonnet-4-6',
        messages: [{ role: 'user', content: '你好，Claude！能不能多说几句话' }],
        max_tokens: 800,
      },
      (chunk) => {
        // 控制台流式输出
        console.log('Received chunk:', chunk);
      },
    );
  }, 30000);
});
