// 创建工具
import { Tool } from './types';

export function createTool(tool: Tool): Tool {
  // 工具创建错误处理
  if (!tool.name || !tool.description || !tool.input_schema) {
    throw new Error('工具必须包含 name、description 和 input_schema');
  }

  return tool;
}
