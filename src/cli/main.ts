import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPrinter } from './printer.ts';
import { registerChatCommand } from './commands/chat.ts';
import { registerDoctorCommand } from './commands/doctor.ts';
import { registerReplCommand } from './commands/repl.ts';
import { registerToolsCommand } from './commands/tools.ts';
import type { CliContext, GlobalCliOptions } from './types.ts';

function readVersionFromPackageJson(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(currentDir, '../../package.json'),
    resolve(currentDir, '../package.json'),
    resolve(currentDir, './package.json'),
  ];
  // 尝试从多个可能的位置读取 package.json，适应不同的安装和运行环境

  for (const packageJsonPath of candidates) {
    try {
      const raw = readFileSync(packageJsonPath, 'utf-8');
      const parsed = JSON.parse(raw) as { version?: unknown };

      if (typeof parsed.version === 'string' && parsed.version.trim()) {
        return parsed.version;
      }
    } catch {
      // 如果读取或解析失败，继续尝试下一个路径
      continue;
    }
  }

  try {
    if (typeof process.env.npm_package_version === 'string' && process.env.npm_package_version) {
      return process.env.npm_package_version;
    }
  } catch {
    // 如果访问环境变量失败，继续返回默认版本
  }

  return '1.0.0';
}

const CLI_VERSION = readVersionFromPackageJson();

export function createCliContext(options: GlobalCliOptions = {}): CliContext {
  return {
    options,
    printer: createPrinter({
      format: options.json ? 'json' : 'text',
      verbose: options.verbose,
    }),
  };
}

export function buildCliProgram(): Command {
  const program = new Command();

  program
    .name('nano-claude')
    .description('A lightweight Claude coding agent CLI')
    .version(CLI_VERSION)
    .showHelpAfterError('(add --help for additional information)');

  registerChatCommand(program, createCliContext);
  registerReplCommand(program, createCliContext);
  registerToolsCommand(program, createCliContext);
  registerDoctorCommand(program, createCliContext);

  return program;
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = buildCliProgram();
  await program.parseAsync(argv);
}
