// 工具管理（client tools / server tools）
import { Tool } from '../types/tools.js';

export class ToolManager {
  private tools = new Map<string, Tool>();

  constructor(initialTools: Tool[] = []) {
    initialTools.forEach((tool) => this.register(tool));
  }

  register(tool: Tool): void {
    const key = ('name' in tool && tool.name) || ('type' in tool && tool.type) || undefined;

    if (!key) {
      throw new Error('Tool 必须包含 name（client tool）或 type（server tool）');
    }

    this.tools.set(key, tool);
  }

  get(key: string): Tool | undefined {
    return this.tools.get(key);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }
}
