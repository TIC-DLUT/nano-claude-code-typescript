import { CacheControl } from './common.js';

/**
 * 自定义（Client-side）工具：你自己在本地/服务器执行，Claude 只负责发起调用。
 */
export interface ClientTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean;
  };

  /** 可选：工具输入示例，帮助模型理解如何调用工具 */
  input_example?: Array<{ name?: string; input: Record<string, any> }>;

  cache_control?: CacheControl;
}

/**
 * Server tools（Claude 服务器侧工具）：由 Claude 平台执行的内置工具（如 web_search/web_fetch 等）。
 * 不同工具会有不同字段，这里保留宽松类型以适配新版本。
 */
export interface ServerTool {
  type: string;
  name?: string;
  [key: string]: any;
}

export type Tool = ClientTool | ServerTool;
