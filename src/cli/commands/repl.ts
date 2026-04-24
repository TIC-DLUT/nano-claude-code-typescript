import type { Command } from 'commander';
import { runRepl } from '../handlers/repl.ts';
import type { CliContextFactory, ReplCommandOptions } from '../types.ts';

export function registerReplCommand(program: Command, createContext: CliContextFactory): void {
  program
    .command('repl')
    .description('Start interactive REPL mode')
    .option('-m, --model <model>', 'Model override')
    .option('--json', 'Output machine-readable JSON logs', false)
    .option('--verbose', 'Enable verbose debug logs', false)
    .option('--no-stream', 'Disable stream mode at startup')
    .action(async (options) => {
      const commandOptions: ReplCommandOptions = {
        model: options.model,
        stream: Boolean(options.stream),
        json: Boolean(options.json),
        verbose: Boolean(options.verbose),
      };
      const context = createContext(commandOptions);
      const code = await runRepl(commandOptions, context);

      if (code !== 0) {
        process.exitCode = code;
      }
    });
}
