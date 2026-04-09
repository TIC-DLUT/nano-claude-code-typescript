//定义content类型
export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock;

/** 标准文本块 */
export interface TextBlock {
  type: 'text';
  text: string;
}

/** * [2026 核心更新] 思维块
 * 当 RequestBody 开启了 thinking 模式时，模型会先输出此块。
 */
export interface ThinkingBlock {
  type: 'thinking';
  /** 模型的推理逻辑 */
  thinking: string;
  /** 某些安全合规场景下的签名校验 */
  signature?: string;
}

/** 工具调用块 */
export interface ToolUseBlock {
  type: 'tool_use';
  /** 工具调用的唯一 ID，后续提交 tool_result 时必须引用 */
  id: string;
  /** 工具名称 */
  name: string;
  /** 工具输入参数（JSON 对象） */
  input: Record<string, any>;
}

// 定义引用类型
export interface Citation {
  type: 'char_location' | 'page_location';
  cited_text: string;
  document_index: number;
  document_title: string;
  start_char_index: number;
  end_char_index: number;
  file_id?: string;
}

// 定义响应体类型

export interface ResponseBody {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<ContentBlock>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_creation_output_tokens?: number;
  };
  container?: {
    id: string;
    expires_at: string;
  };
}
