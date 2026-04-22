// 创建工具
import { ClientTool } from '../types/tools.ts';

export function createTool(tool: ClientTool): ClientTool {
  // 工具创建错误处理
  if (!tool.name || !tool.description || !tool.input_schema) {
    throw new Error('工具必须包含 name、description 和 input_schema');
  }

  return tool;
}
