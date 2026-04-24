import { startRepl } from '../repl.ts';

export interface ReplHandlerOptions {
  model?: string;
  stream?: boolean;
}

export async function runRepl(options: ReplHandlerOptions): Promise<number> {
  return startRepl({
    model: options.model,
    streamEnabled: options.stream,
  });
}
