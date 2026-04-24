import { initTools } from '../../tools/init.ts';
import { getToolsForRequest } from '../../tools/registry.ts';
import type { Tool } from '../../types/tools.ts';

function getToolLabel(tool: Tool): string {
  if ('name' in tool && tool.name) return tool.name;
  if ('type' in tool && tool.type) return tool.type;
  return 'unknown';
}

export function runToolsList(): number {
  try {
    initTools();
    const tools = getToolsForRequest();

    if (tools.length === 0) {
      console.log('No tools registered.');
      return 0;
    }

    console.log('Registered tools:');
    for (const tool of tools) {
      console.log(`- ${getToolLabel(tool)}`);
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`tools list failed: ${message}`);
    return 1;
  }
}
