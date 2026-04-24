// bash工具的handler

type BashInput = {
  command: string;
};

export async function bashHandler(input: BashInput): Promise<string> {
  const { command } = input;
  if (typeof command !== 'string' || !command.trim()) {
    throw new Error('bash tool missing required parameter: command (string)');
  }
  const { exec } = await import('node:child_process');

  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        timeout: 60_000,
        maxBuffer: 2 * 1024 * 1024,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (error) {
          const detail = stderr?.trim() || error.message;
          reject(new Error(`bash command failed: ${detail}`));
          return;
        }

        const output = [stdout?.trimEnd(), stderr?.trimEnd()].filter(Boolean).join('\n');
        resolve(output || '(command finished with no output)');
      },
    );
  });
}
