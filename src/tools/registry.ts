import { ToolManager } from './toolManager.js';
import type { ClientTool, Tool } from '../types/tools.js';

export type ToolHandler = (input: any) => any | Promise<any>;

export const toolRegistry = new ToolManager();
export const toolHandlers = new Map<string, ToolHandler>();

export function registerClientTool(tool: ClientTool, handler: ToolHandler): void {
  toolRegistry.register(tool);
  toolHandlers.set(tool.name, handler);
}

function isClientTool(tool: Tool): tool is ClientTool {
  return typeof (tool as any)?.name === 'string' && !!(tool as any)?.input_schema;
}

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
