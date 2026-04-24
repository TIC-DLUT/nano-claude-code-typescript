// 定义读文件工具
import type { ClientTool } from '../../types/tools.js';
import { createTool } from '../tool.js';

export const readFileTool: ClientTool = createTool({
  name: 'read_file',
  description: '读取指定文件的内容',
  input_schema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: '要读取的文件路径',
      },
    },
    required: ['file_path'],
    additionalProperties: false,
  },

  input_example: [
    {
      input: {
        file_path: '/path/to/file.txt',
      },
    },
  ],
});
