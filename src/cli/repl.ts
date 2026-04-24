/**
 * 在这里实现一个简单的 REPL（Read-Eval-Print Loop）界面，并且且支持一些基本的命令，例如查看帮助、列出工具、开启/关闭流式输出等。
 * 这个 REPL 将会使用 readline 模块来处理用户输入，并且调用 initAgent 来获取 run 和 runStream 方法来执行用户的输入。
 * 用户可以通过输入 /help 来查看可用的命令，通过输入 /tools 来查看注册的工具，通过输入 /stream on/off 来开启或关闭流式输出，通过输入 /reset 来重置对话，或者输入 /exit 来退出 REPL。
 * 在执行用户输入时，如果启用了流式输出，则会逐步打印助手的响应；如果没有启用流式输出，则会一次性打印完整的响应。
 * 同时，REPL 还会捕获并打印任何执行过程中发生的错误。
 */

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
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
  const { run, runStream } = await initAgent(); // 这里复用了agent的逻辑，保持cli和agent的核心逻辑一致
  const rl = readline.createInterface({ input, output }); // 创建 readline 接口，接收用户输入并输出到控制台

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
          {
            conversation,
            model: options.model,
            onDebug: (event) => {
              printer.debug('stream_debug', event);
            },
          },
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
