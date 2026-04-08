// 测试baseurl和apikey是否有效
import * as dotenv from 'dotenv';

dotenv.config();

import { describe, it, expect } from 'vitest';
import { ClaudeClient } from '../src/client.ts';

describe('ClaudeClient', () => {
  it('should call Claude API and return response text', async () => {
    const client = new ClaudeClient(process.env.CLAUDE_BASE_URL, process.env.CLAUDE_API_KEY);
    const response = await client.call({
      model: 'claude-sonnet-4-6',
      messages: [{ role: 'user', content: 'Hello, Claude!' }],
      max_tokens: 100,
    });
    // 打印响应内容以便调试
    console.log('Claude API Response:', response);
    // 预期能够成功调用Claude API并返回json
    expect(typeof response).toBe('string');
  });
});
