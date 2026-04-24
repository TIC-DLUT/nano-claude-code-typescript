// 设置cli的统一输出工具，统一管理输出格式等
import type { Printer, PrinterOptions } from './types.ts';

interface JsonEvent {
  level: 'info' | 'warn' | 'error' | 'debug' | 'assistant' | 'assistant_chunk';
  message?: string;
  data?: unknown;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: 'failed_to_serialize_json' });
  }
}

function writeJsonEvent(event: JsonEvent, toError = false): void {
  const line = `${safeJson(event)}\n`;
  if (toError) {
    process.stderr.write(line);
    return;
  }
  process.stdout.write(line);
}

function writeTextLine(message: string, toError = false): void {
  if (toError) {
    process.stderr.write(`${message}\n`);
    return;
  }
  process.stdout.write(`${message}\n`);
}

export function createPrinter(options: PrinterOptions = {}): Printer {
  const format = options.format ?? 'text';
  const verbose = options.verbose ?? false;
  const jsonMode = format === 'json';

  return {
    info(message: string) {
      if (jsonMode) {
        writeJsonEvent({ level: 'info', message });
        return;
      }
      writeTextLine(message);
    },

    warn(message: string) {
      if (jsonMode) {
        writeJsonEvent({ level: 'warn', message }, true);
        return;
      }
      writeTextLine(message, true);
    },

    error(message: string) {
      if (jsonMode) {
        writeJsonEvent({ level: 'error', message }, true);
        return;
      }
      writeTextLine(message, true);
    },

    debug(message: string, meta?: unknown) {
      if (!verbose) return;

      if (jsonMode) {
        writeJsonEvent({ level: 'debug', message, data: meta });
        return;
      }

      if (typeof meta === 'undefined') {
        writeTextLine(`[debug] ${message}`);
        return;
      }

      writeTextLine(`[debug] ${message} ${safeJson(meta)}`);
    },

    assistant(message: string) {
      if (jsonMode) {
        writeJsonEvent({ level: 'assistant', message });
        return;
      }
      writeTextLine(`assistant> ${message}`);
    },

    assistantChunk(chunk: string) {
      if (!chunk) return;

      if (jsonMode) {
        writeJsonEvent({ level: 'assistant_chunk', message: chunk });
        return;
      }

      process.stdout.write(chunk);
    },

    newline() {
      process.stdout.write('\n');
    },

    json(data: unknown) {
      process.stdout.write(`${safeJson(data)}\n`);
    },
  };
}
