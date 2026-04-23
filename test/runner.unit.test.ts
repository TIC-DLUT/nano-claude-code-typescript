import { describe, it, expect, vi } from 'vitest';
import type { ClaudeClient } from '../src/llm/client.ts';
import { Conversation } from '../src/models/conversation.ts';
import { Message } from '../src/models/message.ts';
import { createRunner } from '../src/agent/runner.ts';
import type { RequestBody } from '../src/types/request.ts';
import type { Tool } from '../src/types/tools.ts';
import type { ResponseBody } from '../src/types/response.ts';

function makeTextResponse(text: string): ResponseBody {
  return {
    id: 'resp-text',
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text }],
    model: 'claude-sonnet-4-6',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  };
}

describe('createRunner', () => {
  it('should build request with defaults and overrides', async () => {
    const seenRequests: RequestBody[] = [];
    const call = vi.fn(async (request: RequestBody, conversation: Conversation) => {
      seenRequests.push(request);
      conversation.rawResponses.push(makeTextResponse('ok'));
      conversation.addMessage(new Message('assistant', 'ok'));
      return 'ok';
    });

    const client = { call, callStream: vi.fn() } as unknown as ClaudeClient; // 强制断言简化测试
    const runner = createRunner(client, {
      model: 'claude-sonnet-4-6',
      maxTokens: 1024,
      maxTurns: 8,
    });

    const customTool: Tool = {
      name: 'weather',
      description: 'weather tool',
      input_schema: { type: 'object', properties: { city: { type: 'string' } } },
    };

    const result = await runner.run('hello', {
      model: 'claude-opus-4-7',
      maxTokens: 222,
      maxTurns: 2,
      tools: [customTool],
      tool_choice: { type: 'auto' },
    });

    expect(result.text).toBe('ok');
    expect(result.turns).toBe(1);
    expect(seenRequests[0].model).toBe('claude-opus-4-7');
    expect(seenRequests[0].max_tokens).toBe(222);
    expect(seenRequests[0].tool_choice).toEqual({ type: 'auto' });
    expect(seenRequests[0].tools?.[0]).toMatchObject({ name: 'weather' });
  });
});
