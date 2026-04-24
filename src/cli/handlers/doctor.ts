import { initConfig } from '../../config/init.ts';
import { initTools } from '../../tools/init.ts';

const REQUIRED_ENV_KEYS = ['CLAUDE_BASE_URL', 'CLAUDE_API_KEY'] as const;

export async function runDoctor(): Promise<number> {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    for (const key of missing) {
      console.error(`- ${key}`);
    }
    return 3;
  }

  try {
    await initConfig();
    initTools();

    console.log('OK: configuration and tool initialization are valid.');
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`doctor failed: ${message}`);
    return 3;
  }
}
