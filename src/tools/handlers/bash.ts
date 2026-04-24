// bash工具的handler

type BashInput = {
  command: string;
};

export async function bashHandler(input: BashInput): Promise<string> {
  const { command } = input;
  if (typeof command !== 'string' || !command.trim()) {
    throw new Error('bash tool missing required parameter: command (string)');
  }
  const { exec } = await import('child_process');
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`执行bash命令失败: ${error.message}`));
      } else if (stderr) {
        reject(new Error(`bash命令执行错误: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}
