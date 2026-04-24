import { initAgent } from '../../agent/init.js';
import type { ChatCommandOptions, CliContext, CliExitCode } from '../types.js';
import { CLI_EXIT_CODE } from '../types.js';

export async function runChat(
  prompt: string,
  options: ChatCommandOptions,
  ctx: CliContext,
): Promise<CliExitCode> {
  const input = prompt.trim();
  if (!input) {
    ctx.printer.error('Prompt is required for chat command.');
    return CLI_EXIT_CODE.INVALID_ARGUMENT;
  }

  try {
    const { run, runStream } = await initAgent();

    if (options.stream) {
      await runStream(
        input,
        (chunk) => {
          ctx.printer.assistantChunk(chunk);
        },
        {
          model: options.model,
          maxTurns: options.maxTurns,
          maxTokens: options.maxTokens,
          onDebug: (event) => {
            ctx.printer.debug('stream_debug', event);
          },
        },
      );
      ctx.printer.newline();
      return CLI_EXIT_CODE.OK;
    }

    const result = await run(input, {
      model: options.model,
      maxTurns: options.maxTurns,
      maxTokens: options.maxTokens,
    });

    ctx.printer.assistant(result.text);
    return CLI_EXIT_CODE.OK;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.printer.error(`chat failed: ${message}`);
    return CLI_EXIT_CODE.RUNTIME_ERROR;
  }
}
