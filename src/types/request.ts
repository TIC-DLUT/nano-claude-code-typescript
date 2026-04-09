// 定义请求头类型
import { Message } from '../models/message.ts';
import { Tool } from './tools.ts';

export interface RequestHeader {
  'x-api-key': string;
  'anthropic-version': string;
  Authorization: string;
  'Content-Type': 'application/json';
}

// 定义请求体类型
export interface RequestBody {
  model: string;
  max_tokens: number;
  messages: Message[];
  system?: string;
  tools?: Tool[]; // 工具列表，供模型调用
  tool_choice?: 'auto' | 'any' | { type: 'tool'; name: string }; // 是否允许模型自动选择工具
}
