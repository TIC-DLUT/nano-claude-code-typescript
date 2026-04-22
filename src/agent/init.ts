// agent初始化
import { initConfig } from '../config/init.ts';
import { ClaudeClient } from '../llm/client.ts';
import { callWithTools, callStreamWithTools } from './callTool.ts';
import '../tools/registry.ts';

export async function initAgent() {
  const config = await initConfig();
  const claudeClient = new ClaudeClient(config.claudeBaseUrl, config.claudeApiKey);
  return {
    claudeClient,
    config,
    async run(userText: string) {
      return callWithTools(client, {
        model: config.claudeModel,
        messages: [
          {
            role: 'user',
            content: userText,
          },
        ],
      });
    },
    async runStream(userText: string, onData: (chunk: string) => void) {
      return callStreamWithTools(
        client,
        {
          model: config.claudeModel,
          messages: [
            {
              role: 'user',
              content: userText,
            },
          ],
        },
        onData,
      );
    },
  };
}
