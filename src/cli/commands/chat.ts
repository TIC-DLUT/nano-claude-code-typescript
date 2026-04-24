import type { Command } from 'commander';
import { runChat } from '../handlers/chat.ts';
import type { ChatCommandOptions, CliContextFactory } from '../types.ts';

function parsePositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, received: ${value}`);
  }
  return parsed;
}

export function registerChatCommand(program: Command, createContext: CliContextFactory): void {
  program
    .command('chat')
    .description('Run a single non-interactive chat request')
    .argument('<prompt...>', 'Prompt content')
    .option('-s, --stream', 'Enable stream mode', false)
    .option('-m, --model <model>', 'Model override')
    .option('--json', 'Output machine-readable JSON logs', false)
    .option('--verbose', 'Enable verbose debug logs', false)
    .option('--max-turns <n>', 'Maximum tool-loop turns', parsePositiveInt)
    .option('--max-tokens <n>', 'Maximum output tokens', parsePositiveInt)
    .action(async (promptParts: string[], options) => {
      const commandOptions: ChatCommandOptions = {
        stream: Boolean(options.stream),
        model: options.model,
        json: Boolean(options.json),
        verbose: Boolean(options.verbose),
        maxTurns: options.maxTurns,
        maxTokens: options.maxTokens,
      };

      const context = createContext(commandOptions);
      const code = await runChat(promptParts.join(' '), commandOptions, context);

      if (code !== 0) {
        process.exitCode = code;
      }
    });
}
