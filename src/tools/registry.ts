// 工具注册（schema + handler）
import { ToolManager } from './toolManager.ts';
import type { ClientTool } from '../types/tools.ts';
import type { Tool } from '../types/tools.ts';

import { weatherTool } from './schemas/weather.ts';
import { weatherHandler } from './handlers/weather.ts';

export type ToolHandler = (input: any) => any | Promise<any>;

/**
 * toolRegistry 只存放「发给模型看的」工具 schema（ClientTool / ServerTool）。
 * handler 则存放在单独的映射里，避免把运行时代码塞进 schema 类型。
 */
export const toolRegistry = new ToolManager();
export const toolHandlers = new Map<string, ToolHandler>();

export function registerClientTool(tool: ClientTool, handler: ToolHandler): void {
  toolRegistry.register(tool);
  toolHandlers.set(tool.name, handler);
}

function isClientTool(tool: Tool): tool is ClientTool {
  return typeof (tool as any)?.name === 'string' && !!(tool as any)?.input_schema;
}

/**
 * 将本地的工具定义裁剪成「可安全发送给模型 API」的形态。
 * 一些网关/Bedrock 会严格校验字段，遇到 input_example 等自定义字段会 400。
 */
export function sanitizeToolForRequest(tool: Tool): Tool {
  if (!isClientTool(tool)) return tool;

  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
  } satisfies ClientTool;
}

export function sanitizeToolsForRequest(tools: Tool[]): Tool[] {
  return tools.map(sanitizeToolForRequest);
}

export function getToolsForRequest(): Tool[] {
  return sanitizeToolsForRequest(toolRegistry.list());
}

// 注册工具
registerClientTool(weatherTool, weatherHandler);
