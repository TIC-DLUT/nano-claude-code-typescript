// 读文件工具的处理器

type ReadFileInput = {
  file_path: string;
};

export async function readFileHandler(input: ReadFileInput): Promise<string> {
  const { file_path } = input;
  if (typeof file_path !== 'string' || !file_path.trim()) {
    throw new Error('read_file 工具缺少必填参数：file_path（string）');
  }
  const fs = await import('fs/promises');
  try {
    const data = await fs.readFile(file_path, 'utf8');
    return data;
  } catch (error) {
    throw new Error(`读取文件失败: ${error.message}`);
  }
}
