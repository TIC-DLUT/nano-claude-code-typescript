// 写文件工具的handler

type WriteFileInput = {
  file_path: string;
  content: string;
};

export async function writeFileHandler(input: WriteFileInput): Promise<string> {
  const { file_path, content } = input;
  if (typeof file_path !== 'string' || !file_path.trim()) {
    throw new Error('write_file tool missing required parameter: file_path (string)');
  }
  if (typeof content !== 'string') {
    throw new Error('write_file tool missing required parameter: content (string)');
  }

  const fs = await import('fs/promises');
  try {
    await fs.writeFile(file_path, content, 'utf8');
    return `成功将内容写入文件: ${file_path}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`failed to write file: ${message}`);
  }
}
