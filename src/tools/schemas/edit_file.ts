// TODO: 编辑文件工具

import type { ClientTool } from '../../types/tools.js';
import { createTool } from '../tool.js';

export const editFileTool: ClientTool = createTool({
  name: 'edit_file',
  description: '编辑指定文件的内容',
  input_schema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: '要编辑的文件路径',
      },
      new_content: {
        type: 'string',
        description: '新的文件内容',
      },
    },
    required: ['file_path', 'new_content'],
    additionalProperties: false,
  },

  input_example: [
    {
      input: {
        file_path: '/path/to/file.txt',
        new_content: '这是新的文件内容。',
      },
    },
  ],
});
