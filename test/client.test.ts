// 使用vitest测试client.ts中的函数
import { describe, it, expect, vi } from 'vitest';
import { ClaudeClient } from '../src/llm/client.ts';
import { ClaudeCall } from '../src/llm/call.ts';
import { Message } from '../src/models/message.ts';

describe('ClaudeClient', () => {
  it('用mock的caller测试client，只测试逻辑不涉及网络请求', async () => {
    const callSpy = vi
      .spyOn(ClaudeCall.prototype, 'callClaude')
      .mockResolvedValue('Mocked response from Claude API');

    // 创建一个ClaudeClient实例
    const client = ClaudeClient.newClaudeClient('https://api.anthropic.com', 'fake-api-key');

    // 请求
    const result = await client.call({
      model: 'claude-sonnet-4-6',
      messages: [new Message('user', 'Hello, Claude!')],
      max_tokens: 100,
    });
    // 断言结果
    expect(result).toBe('Mocked response from Claude API');
  });
});
