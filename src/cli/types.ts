export const CLI_EXIT_CODE = {
  OK: 0,
  RUNTIME_ERROR: 1,
  INVALID_ARGUMENT: 2,
  CONFIG_ERROR: 3,
} as const;

export type CliExitCode = (typeof CLI_EXIT_CODE)[keyof typeof CLI_EXIT_CODE];

export type CliOutputFormat = 'text' | 'json';

export interface GlobalCliOptions {
  model?: string;
  json?: boolean;
  verbose?: boolean;
}

export interface ChatCommandOptions extends GlobalCliOptions {
  stream?: boolean;
  maxTurns?: number;
  maxTokens?: number;
}

export interface ReplCommandOptions extends GlobalCliOptions {
  stream?: boolean;
}

export type ToolsListOptions = GlobalCliOptions;

export type DoctorCommandOptions = GlobalCliOptions;

export interface Printer {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string, meta?: unknown): void;
  assistant(message: string): void;
  assistantChunk(chunk: string): void;
  newline(): void;
  json(data: unknown): void;
}

export interface PrinterOptions {
  format?: CliOutputFormat;
  verbose?: boolean;
}

export interface CliContext {
  options: GlobalCliOptions;
  printer: Printer;
}

export type CliContextFactory = (options: GlobalCliOptions) => CliContext;
