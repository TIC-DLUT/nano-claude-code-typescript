// 定义请求头类型
import { Message } from '../models/message.ts';
import { Tool } from './tools.ts';

export interface RequestHeader {
  'x-api-key': string;
  'anthropic-version': string;
  Authorization: string;
  'Content-Type': 'application/json';
}

export type SystemContentBlock = SystemTextBlock | SystemImageBlock | SystemDocumentBlock;

/** 最常用的文本系统块 */
export interface SystemTextBlock {
  type: 'text';
  text: string;

  /** * [2026 核心更新]
   * 用于显式标记缓存断点。
   * 注意：如果 RequestBody 中开启了 cache_control: { type: 'automatic' }，
   * 这里的手动标记会被系统自动优化。
   */
  cache_control?: {
    type: 'ephemeral';
  };
}

/** [2026 新增] 系统级图像块：用于给模型设定“视觉基准”，例如 UI 规范图 */
export interface SystemImageBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  };
  cache_control?: { type: 'ephemeral' };
}

/** [2025/2026 增强] 系统级文档块：将知识库作为系统上下文直接输入 */
export interface SystemDocumentBlock {
  type: 'document';
  source: {
    type: 'base64';
    media_type: 'application/pdf' | 'text/plain' | 'text/markdown';
    data: string;
  };
  /** 文档块通常很大，强烈建议开启缓存 */
  cache_control?: { type: 'ephemeral' };
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
  tools?: Array<Tool>; // 工具列表，供模型调用
  tool_choice?: { type: 'auto' } | { type: 'any' } | { type: 'tool'; name: string }; // 是否允许模型自动选择工具
  stream?: boolean;
}
