import type { Command } from 'commander';
import { runToolsList } from '../handlers/toolsList.ts';

export function registerToolsCommand(program: Command): void {
  const tools = program.command('tools').description('Inspect registered tools');

  tools.command('list').description('List tools available to the agent').action(() => {
    const code = runToolsList();
    if (code !== 0) {
      process.exitCode = code;
    }
  });
}
