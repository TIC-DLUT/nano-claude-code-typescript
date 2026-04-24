import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { pathToFileURL } from 'node:url';
import { initAgent } from '../agent/init.ts';
import { Conversation } from '../models/conversation.ts';
import { getToolsForRequest } from '../tools/registry.ts';
import type { Tool } from '../types/tools.ts';
import { createPrinter } from './printer.ts';
import { CLI_EXIT_CODE } from './types.ts';
import type { CliExitCode, Printer } from './types.ts';

export interface ReplStartOptions {
  model?: string;
  streamEnabled?: boolean;
  printer?: Printer;
}

function printHelp(printer: Printer): void {
  printer.info(`
Commands:
  /help           Show help
  /tools          List registered tools
  /stream on      Enable stream mode
  /stream off     Disable stream mode
  /reset          Reset conversation
  /exit           Exit REPL
`);
}

function getToolLabel(tool: Tool): string {
  if ('name' in tool && tool.name) return tool.name;
  if ('type' in tool && tool.type) return tool.type;
  return 'unknown';
}

export async function startRepl(options: ReplStartOptions = {}): Promise<CliExitCode> {
  const { run, runStream } = await initAgent();
  const rl = readline.createInterface({ input, output });
  const printer = options.printer ?? createPrinter();

  let conversation = new Conversation();
  let streamEnabled = options.streamEnabled ?? true;

  printer.info('Nano Claude Code REPL');
  printer.info('Type /help to see commands.');

  while (true) {
    const line = (await rl.question('> ')).trim();
    if (!line) continue;

    if (line.startsWith('/')) {
      if (line === '/exit') {
        rl.close();
        break;
      }

      if (line === '/help') {
        printHelp(printer);
        continue;
      }

      if (line === '/reset') {
        conversation = new Conversation();
        printer.info('Conversation reset.');
        continue;
      }

      if (line === '/tools') {
        const tools = getToolsForRequest();
        if (!tools.length) {
          printer.info('No tools registered.');
          continue;
        }
        printer.info('Registered tools:');
        for (const tool of tools) {
          printer.info(`- ${getToolLabel(tool)}`);
        }
        continue;
      }

      if (line === '/stream on') {
        streamEnabled = true;
        printer.info('Stream mode enabled.');
        continue;
      }

      if (line === '/stream off') {
        streamEnabled = false;
        printer.info('Stream mode disabled.');
        continue;
      }

      printer.warn('Unknown command. Use /help.');
      continue;
    }

    try {
      if (streamEnabled) {
        await runStream(
          line,
          (chunk) => {
            printer.assistantChunk(chunk);
          },
          { conversation, model: options.model },
        );
        printer.newline();
      } else {
        const result = await run(line, { conversation, model: options.model });
        printer.assistant(result.text);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      printer.error(`Error: ${message}`);
    }
  }

  return CLI_EXIT_CODE.OK;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startRepl().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    const printer = createPrinter();
    printer.error(`Failed to start REPL: ${message}`);
    process.exitCode = 1;
  });
}
