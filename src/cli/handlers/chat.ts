import { initAgent } from '../../agent/init.ts';

export interface ChatHandlerOptions {
  stream?: boolean;
  model?: string;
  maxTurns?: number;
  maxTokens?: number;
}

export async function runChat(prompt: string, options: ChatHandlerOptions): Promise<number> {
  const input = prompt.trim();
  if (!input) {
    console.error('Prompt is required for chat command.');
    return 2;
  }

  try {
    const { run, runStream } = await initAgent();

    if (options.stream) {
      process.stdout.write('assistant> ');
      await runStream(
        input,
        (chunk) => {
          process.stdout.write(chunk);
        },
        {
          model: options.model,
          maxTurns: options.maxTurns,
          maxTokens: options.maxTokens,
        },
      );
      process.stdout.write('\n');
      return 0;
    }

    const result = await run(input, {
      model: options.model,
      maxTurns: options.maxTurns,
      maxTokens: options.maxTokens,
    });

    console.log(result.text);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`chat failed: ${message}`);
    return 1;
  }
}
