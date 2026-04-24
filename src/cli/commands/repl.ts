import type { Command } from 'commander';
import { runRepl } from '../handlers/repl.ts';

export function registerReplCommand(program: Command): void {
  program
    .command('repl')
    .description('Start interactive REPL mode')
    .option('-m, --model <model>', 'Model override')
    .option('--no-stream', 'Disable stream mode at startup')
    .action(async (options) => {
      const code = await runRepl({
        model: options.model,
        stream: Boolean(options.stream),
      });

      if (code !== 0) {
        process.exitCode = code;
      }
    });
}
