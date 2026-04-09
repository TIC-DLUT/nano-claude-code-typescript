// 定义请求头类型
import { Message } from '../models/message.ts';
import { ToolDefinition } from './tools.ts';

export interface RequestHeader {
  'x-api-key': string;
  'anthropic-version': string;
  Authorization: string;
  'Content-Type': 'application/json';
}

// 定义请求体类型
export interface RequestBody {
  model: string;
  messages: Message[];
  system?: string | Array<SystemContentBlock>; // 可选的系统提示，可以是字符串或更复杂的结构
  max_tokens: number;
  thinking?: {
    type: 'enabled' | 'disabled';
    budget_tokens?: number; // 允许用于思考的 token 预算
    encryption?: 'enabled' | 'disabled'; // 思考内容的加密选项
  };
  cache_control?: {
    type: 'ephemeral' | 'automatic';
  };
  tools?: Array<ToolDefinition>; // 工具列表，供模型调用
  tool_choice?: { type: 'auto' } | { type: 'any' } | { type: 'tool'; name: string }; // 是否允许模型自动选择工具
  stream?: boolean;
}
