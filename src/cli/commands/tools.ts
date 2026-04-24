import type { Command } from 'commander';
import { runToolsList } from '../handlers/toolsList.ts';
import type { CliContextFactory, ToolsListOptions } from '../types.ts';

export function registerToolsCommand(program: Command, createContext: CliContextFactory): void {
  const tools = program.command('tools').description('Inspect registered tools');

  tools
    .command('list')
    .description('List tools available to the agent')
    .option('--json', 'Output machine-readable JSON logs', false)
    .option('--verbose', 'Enable verbose debug logs', false)
    .action((options) => {
      const commandOptions: ToolsListOptions = {
        json: Boolean(options.json),
        verbose: Boolean(options.verbose),
      };
      const context = createContext(commandOptions);
      const code = runToolsList(commandOptions, context);
      if (code !== 0) {
        process.exitCode = code;
      }
    });
}
