import { initTools } from '../../tools/init.ts';
import { getToolsForRequest } from '../../tools/registry.ts';
import type { Tool } from '../../types/tools.ts';
import type { CliContext, CliExitCode, ToolsListOptions } from '../types.ts';
import { CLI_EXIT_CODE } from '../types.ts';

function getToolLabel(tool: Tool): string {
  if ('name' in tool && tool.name) return tool.name;
  if ('type' in tool && tool.type) return tool.type;
  return 'unknown';
}

export function runToolsList(options: ToolsListOptions, ctx: CliContext): CliExitCode {
  try {
    initTools();
    const tools = getToolsForRequest();
    const labels = tools.map(getToolLabel);

    if (options.json) {
      ctx.printer.json({ tools: labels });
      return CLI_EXIT_CODE.OK;
    }

    if (tools.length === 0) {
      ctx.printer.info('No tools registered.');
      return CLI_EXIT_CODE.OK;
    }

    ctx.printer.info('Registered tools:');
    for (const label of labels) {
      ctx.printer.info(`- ${label}`);
    }

    return CLI_EXIT_CODE.OK;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.printer.error(`tools list failed: ${message}`);
    return CLI_EXIT_CODE.RUNTIME_ERROR;
  }
}
