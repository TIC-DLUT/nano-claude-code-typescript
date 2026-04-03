// 将请求头等封装在此处
import { Message } from './message.ts';

// 定义请求头类型
export interface RequestHeader {
  'x-api-key': string;
  'anthropic-version': string;
  'Content-Type': 'application/json';
}

// 定义请求体类型
export interface RequestBody {
  model: string;
  max_tokens: number;
  messages: Message[];
  system?: string;
}

// 定义响应体类型
export interface ResponseBody {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
