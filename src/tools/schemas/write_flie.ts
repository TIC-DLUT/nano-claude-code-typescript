// TODO: 写文件工具

import type { ClientTool } from '../../types/tools.ts';
import { createTool } from '../tool.ts';

export const writeFileTool: ClientTool = createTool({
  name: 'write_file',
  description: '将内容写入指定文件',
  input_schema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: '要写入的文件路径',
      },
      content: {
        type: 'string',
        description: '要写入文件的内容',
      },
    },
    required: ['file_path', 'content'],
    additionalProperties: false,
  },

  input_example: [
    {
      input: {
        file_path: '/path/to/file.txt',
        content: '这是要写入文件的内容。',
      },
    },
  ],
});
