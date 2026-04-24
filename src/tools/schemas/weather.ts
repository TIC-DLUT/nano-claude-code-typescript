// 定义天气工具对象
import type { ClientTool } from '../../types/tools.js';
import { createTool } from '../tool.js';

export const weatherTool: ClientTool = createTool({
  name: 'weather',
  description: '获取指定城市的当前天气信息',
  input_schema: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: '要查询天气的城市名称(如：北京、New York、Tokyo等)',
      },
    },
    required: ['city'],
    additionalProperties: false,
  },

  input_example: [
    {
      input: {
        city: '北京',
      },
    },
  ],
});
