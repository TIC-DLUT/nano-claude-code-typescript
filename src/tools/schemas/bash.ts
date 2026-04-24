// TODO: bash工具

import type { ClientTool } from '../../types/tools.js';
import { createTool } from '../tool.js';

export const bashTool: ClientTool = createTool({
  name: 'bash',
  description: '执行bash命令',
  input_schema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: '要执行的bash命令',
      },
    },
    required: ['command'],
    additionalProperties: false,
  },

  input_example: [
    {
      input: {
        command: 'ls -la /path/to/directory',
      },
    },
  ],
});
