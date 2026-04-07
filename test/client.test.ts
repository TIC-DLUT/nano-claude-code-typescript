// 使用vitest测试client.ts中的函数
import { describe, it, expect, vi} from 'vitest';
import { ClaudeClient } from '../src/client.ts';
import { ClaudeCall } from '../src/call.ts';
import { Message } from '../src/models/message.ts';

describe('ClaudeClient', () => {
  it('用mock的caller测试client，只测试逻辑不涉及网络请求', async () => {
    const callSpy = vi.spyOn(ClaudeCall.prototype, 'callClaude').mockResolvedValue('Mocked response from Claude API');

    // 创建一个ClaudeClient实例
    const client = ClaudeClient.newClaudeClient('https://api.claude.ai/v1', 'fake-api-key');

    // 请求
    const result = await client.call({
      model: 'claude-4.6-sonnet',
      messages: [
        new Message('user', 'Hello, Claude!'),
      ],
      max_tokens: 100,
    });
    // 断言结果
    expect(result).toBe('Mocked response from Claude API');
    // 断言callClaude方法被正确调用
    expect(callSpy).toHaveBeenCalledWith(
      'https://api.claude.ai/v1',
        'fake-api-key',
        {
            model: 'claude-4.6-sonnet',
            messages: [
                new Message('user', 'Hello, Claude!'),
            ],
            max_tokens: 100,
        },
        expect.anything(), // conversation参数可以是任何值，因为我们不关心它在这个测试中的具体内容
     );
  })
});