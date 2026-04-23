import { runRequestWithTools } from '../src/agent/runner.ts';
import { ClaudeClient } from '../src/llm/client.ts';
import * as dotenv from 'dotenv';

dotenv.config();

describe('runRequestWithTools', () => {
  it('should call tool and return response', async () => {
    const claude = ClaudeClient.newClaudeClient(
      process.env.CLAUDE_BASE_URL as string,
      process.env.CLAUDE_API_KEY as string,
    );
    const res = await runRequestWithTools(claude, {
      model: 'claude-sonnet-4-6',
      messages: [
        {
          role: 'user',
          content: '请调用weather工具获取当前的北京天气情况',
        },
      ],
      max_tokens: 300,
      tool_choice: { type: 'tool', name: 'weather' },
    });
    console.log(res.text);
    expect(res).toBeDefined();
  }, 30000);
});
