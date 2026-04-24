import { describe, it, expect, vi } from 'vitest';
import { ClaudeClient } from '../src/llm/client.ts';
import { ClaudeCall } from '../src/llm/call.ts';
import { Message } from '../src/models/message.ts';

describe('ClaudeClient', () => {
  it('mocks caller and tests client logic without network requests', async () => {
    const callSpy = vi
      .spyOn(ClaudeCall.prototype, 'call')
      .mockResolvedValue('Mocked response from Claude API');

    const client = ClaudeClient.newClaudeClient('https://api.anthropic.com', 'fake-api-key');

    const result = await client.call({
      model: 'claude-sonnet-4-6',
      messages: [new Message('user', 'Hello, Claude!')],
      max_tokens: 100,
    });

    expect(result).toBe('Mocked response from Claude API');
    callSpy.mockRestore();
  });
});
