// 定义请求头 & 请求体类型（Messages API）
import { CacheControl } from './common.ts';
import { ContentBlock } from './response.ts';
import { Tool } from './tools.ts';

export type MessageRole = 'user' | 'assistant';

export interface MessageParam {
  role: MessageRole;
  content: string | Array<ContentBlock>;
}

// 说明：这里让 RequestHeader 具备 string index signature，
// 以便能直接传给 HttpClient（其 headers 类型是 Record<string, string>）。
export type RequestHeader = Record<string, string> & {
  'x-api-key': string;
  'anthropic-version': string;
  'anthropic-beta'?: string;
  Authorization?: string;
  'Content-Type': 'application/json';
};

export type SystemContentBlock = SystemTextBlock | SystemImageBlock | SystemDocumentBlock;

/** 最常用的文本系统块 */
export interface SystemTextBlock {
  type: 'text';
  text: string;

  /**
   * 用于显式标记缓存断点（Prompt Caching）。
   * 注意：如果 RequestBody 顶层启用了 `cache_control`（自动缓存），
   * Claude 仍可能根据规则自动选择/移动断点；显式标记会作为强提示。
   */
  cache_control?: CacheControl;
}

/** [2026 新增] 系统级图像块：用于给模型设定“视觉基准”，例如 UI 规范图 */
export interface SystemImageBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  };
  cache_control?: CacheControl;
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
  cache_control?: CacheControl;
}

// 定义请求体类型
export interface RequestBody {
  model?: string;
  messages: MessageParam[];
  system?: string | Array<SystemContentBlock>; // 可选的系统提示，可以是字符串或更复杂的结构
  max_tokens: number;
  /**
   * Thinking 配置：不同模型/版本可能支持 enabled 或 adaptive。
   * 以官方文档为准。
   */
  thinking?:
    | { type: 'disabled' }
    | { type: 'enabled'; budget_tokens?: number; display?: 'summarized' | 'omitted' }
    | { type: 'adaptive'; display?: 'summarized' | 'omitted' };

  /** 输出质量/推理强度（新模型推荐用 effort 替代 temperature/top_p 等采样参数） */
  output_config?: {
    effort?: 'low' | 'medium' | 'high' | 'max';
  };

  /** Prompt caching：启用自动缓存或设置 TTL */
  cache_control?: CacheControl;

  /** 可选请求元信息 */
  metadata?: Record<string, any>;

  /** 可选采样参数（注意：部分新模型会拒绝非默认值） */
  temperature?: number;
  top_p?: number;
  top_k?: number;

  /** 自定义停止词 */
  stop_sequences?: string[];

  tools?: Array<Tool>; // 工具列表，供模型调用
  tool_choice?: { type: 'auto' } | { type: 'any' } | { type: 'tool'; name: string }; // 是否允许模型自动选择工具
  stream?: boolean;
}
