// 测试baseurl和apikey是否有效
import * as dotenv from 'dotenv';

dotenv.config();

import { describe, it, expect } from 'vitest';
import { ClaudeClient } from '../src/client.ts';

describe('ClaudeClient', () => {
  it('should call Claude API and return response text', async () => {
    const client = ClaudeClient.newClaudeClient(
      process.env.CLAUDE_BASE_URL as string,
      process.env.CLAUDE_API_KEY as string,
    );
    const response = await client.callStream({
      model: 'claude-sonnet-4-6',
      messages: [{ role: 'user', content: 'Hello, Claude!' }],
      max_tokens: 100,
    }, (chunk) => {
      // 处理流式数据
      console.log('Stream Data:', chunk);
    });
    // 预期能够成功调用Claude API并返回json
    expect(typeof response).toBe('string');
  }, 30000);
});
