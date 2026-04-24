// 编辑文件工具的处理器

type EditFileInput = {
  file_path: string;
  new_content: string;
};

export async function editFileHandler(input: EditFileInput): Promise<string> {
  const { file_path, new_content } = input;
  if (typeof file_path !== 'string' || !file_path.trim()) {
    throw new Error('edit_file tool missing required parameter: file_path (string)');
  }
  if (typeof new_content !== 'string') {
    throw new Error('edit_file tool missing required parameter: new_content (string)');
  }

  const fs = await import('fs/promises');
  try {
    await fs.writeFile(file_path, new_content, 'utf8');
    return `成功编辑文件: ${file_path}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`failed to edit file: ${message}`);
  }
}
