import { initConfig } from '../../config/init.ts';
import { initTools } from '../../tools/init.ts';
import type { CliContext, CliExitCode, DoctorCommandOptions } from '../types.ts';
import { CLI_EXIT_CODE } from '../types.ts';

const REQUIRED_ENV_KEYS = ['CLAUDE_BASE_URL', 'CLAUDE_API_KEY'] as const;

export async function runDoctor(
  options: DoctorCommandOptions,
  ctx: CliContext,
): Promise<CliExitCode> {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    if (options.json) {
      ctx.printer.json({ ok: false, missing });
      return CLI_EXIT_CODE.CONFIG_ERROR;
    }

    ctx.printer.error('Missing required environment variables:');
    for (const key of missing) {
      ctx.printer.error(`- ${key}`);
    }
    return CLI_EXIT_CODE.CONFIG_ERROR;
  }

  try {
    await initConfig();
    initTools();

    if (options.json) {
      ctx.printer.json({ ok: true });
    } else {
      ctx.printer.info('OK: configuration and tool initialization are valid.');
    }
    return CLI_EXIT_CODE.OK;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      ctx.printer.json({ ok: false, error: message });
    } else {
      ctx.printer.error(`doctor failed: ${message}`);
    }
    return CLI_EXIT_CODE.CONFIG_ERROR;
  }
}
