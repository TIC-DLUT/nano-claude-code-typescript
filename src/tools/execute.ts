// 工具执行
import { toolHandlers, toolRegistry } from './registry.js';

export async function executeTool(toolName: string, input: any): Promise<any> {
  const tool = toolRegistry.get(toolName);
  if (!tool) throw new Error(`未找到工具 schema: ${toolName}`);

  const handler = toolHandlers.get(toolName);
  if (!handler) throw new Error(`工具 ${toolName} 没有有效的 handler`);

  return await handler(input);
}
