import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerChatCommand } from './commands/chat.ts';
import { registerDoctorCommand } from './commands/doctor.ts';
import { registerReplCommand } from './commands/repl.ts';
import { registerToolsCommand } from './commands/tools.ts';

function readVersionFromPackageJson(): string {
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = resolve(currentDir, '../../package.json');
    const raw = readFileSync(packageJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as { version?: unknown };

    if (typeof parsed.version === 'string' && parsed.version.trim()) {
      return parsed.version;
    }
  } catch {
    // Fallback below.
  }

  return '1.0.0';
}

const CLI_VERSION = readVersionFromPackageJson();

export function buildCliProgram(): Command {
  const program = new Command();

  program
    .name('nano-claude')
    .description('A lightweight Claude coding agent CLI')
    .version(CLI_VERSION)
    .showHelpAfterError('(add --help for additional information)');

  registerChatCommand(program);
  registerReplCommand(program);
  registerToolsCommand(program);
  registerDoctorCommand(program);

  return program;
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = buildCliProgram();
  await program.parseAsync(argv);
}
