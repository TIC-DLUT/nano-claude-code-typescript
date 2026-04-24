import { Message } from '../models/message.ts';
import { HttpClient } from './httpClient.ts';
import { RequestBody, RequestHeader } from '../types/request.ts';
import { ContentBlock, ResponseBody } from '../types/response.ts';
import { Conversation } from '../models/conversation.ts';
import { ClaudeClientOptions } from '../types/client.ts';

// 将请求头、上下文拼接、流式事件解析封装在这里
export type ClaudeStreamDebugEvent =
  | { type: 'server_tool_use_start'; name?: string; index?: number }
  | { type: 'tool_input_json_delta'; index: number; partial_json: string }
  | { type: 'message_stop' }
  | { type: 'sse_json_parse_error'; error: string; raw: string };

export class ClaudeCall {
  private httpClient: HttpClient;
  private apiKey: string;
  private apiVersion: string;
  private betas: string[];
  private defaultHeaders: Record<string, string>;
  private sendAuthorizationHeader: boolean;
  private model?: string;

  constructor(
    httpClient: HttpClient,
    apiKey: string,
    options?: ClaudeClientOptions,
    model?: string,
  ) {
    this.httpClient = httpClient;
    this.apiKey = apiKey;
    this.apiVersion = options?.apiVersion ?? '2023-06-01';
    this.betas = options?.betas ?? [];
    this.defaultHeaders = options?.defaultHeaders ?? {};
    this.sendAuthorizationHeader = options?.sendAuthorizationHeader ?? true;
    this.model = model;
  }

  async call(requestBody: RequestBody, conversation: Conversation): Promise<string> {
    const ctx = this.prepareContext({ ...requestBody, stream: false }, conversation);
    return this.callClaude(ctx.endpoint, ctx.body, ctx.headers, conversation);
  }

  async callStream(
    requestBody: RequestBody,
    conversation: Conversation,
    onData: (data: string) => void,
    onDebug?: (event: ClaudeStreamDebugEvent) => void,
  ): Promise<void> {
    const ctx = this.prepareContext({ ...requestBody, stream: true }, conversation);
    return this.callClaudeStream(
      ctx.endpoint,
      ctx.body,
      ctx.headers,
      conversation,
      onData,
      onDebug,
    );
  }

  private prepareContext(requestBody: RequestBody, conversation: Conversation) {
    const endpoint = '/v1/messages';
    const finalModel = requestBody.model ?? this.model;

    const headers: RequestHeader = {
      'x-api-key': this.apiKey,
      'anthropic-version': this.apiVersion,
      'Content-Type': 'application/json',
      ...(this.betas.length ? { 'anthropic-beta': this.betas.join(',') } : {}),
      ...(this.sendAuthorizationHeader ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      ...this.defaultHeaders,
    };

    // 1. 同步当前请求消息到本地会话（避免重复写入）
    requestBody.messages.forEach((msg) => {
      const isAlreadyInHistory = conversation.history.some(
        (h) => h.role === msg.role && h.content === msg.content,
      );
      if (!isAlreadyInHistory) {
        const messageInstance = msg instanceof Message ? msg : new Message(msg.role, msg.content);
        conversation.addMessage(messageInstance);
      }
    });

    // 2. 构造发给 API 的完整上下文
    const messageForAPI = conversation.history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const body: RequestBody = {
      ...requestBody,
      // 兜底：避免 model/max_tokens 缺失
      model: finalModel,
      max_tokens: requestBody.max_tokens ?? 4096,
      messages: messageForAPI,
      stream: requestBody.stream,
    };

    return { endpoint, headers, body };
  }

  // 普通非流式调用
  private async callClaude(
    endpoint: string,
    body: RequestBody,
    headers: RequestHeader,
    conversation: Conversation,
  ): Promise<string> {
    try {
      const response = await this.httpClient.post(endpoint, body, headers);
      const responseData = response as ResponseBody;
      conversation.rawResponses.push(responseData);

      const assistantMessage = new Message(responseData.role, responseData.content);
      conversation.addMessage(assistantMessage);

      return conversation.getLatestTextContent();
    } catch (error) {
      console.error('Error calling Claude API:', error);
      throw error;
    }
  }

  async callClaudeStream(
    endpoint: string,
    body: RequestBody,
    headers: RequestHeader,
    conversation: Conversation,
    onData: (data: string) => void,
    onDebug?: (event: ClaudeStreamDebugEvent) => void,
  ): Promise<void> {
    // debug 通道：用于工具参数增量/协议事件，不给终端主输出
    const emitDebug = (event: ClaudeStreamDebugEvent): void => {
      if (onDebug) onDebug(event);
    };

    // 用于累积完整文本和 SSE 半包缓存
    let accumulatedText = '';
    let buffer = '';

    // 用于还原 Claude 流式 content blocks（包含 tool_use / thinking）
    const contentBlocks: Array<ContentBlock | undefined> = [];
    const toolInputJsonByIndex: Record<number, string> = {};
    let streamMessage: Partial<ResponseBody> | undefined;

    try {
      // 3. 开始执行流式请求，逐行解析 SSE
      await this.httpClient.postStream(endpoint, body, headers, (chunk) => {
        buffer += chunk;
        const lines = buffer.split(/\r?\n/);
        // 最后一行可能是不完整 JSON，留待下一批 chunk 继续拼
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          // 过滤非 data 行（event/ping/空行）
          if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

          const jsonStr = trimmedLine.replace(/^data:\s*/, '');
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const eventData = JSON.parse(jsonStr);

            switch (eventData.type) {
              case 'message_start':
                streamMessage = eventData.message;
                break;

              case 'content_block_start': {
                const index: number = eventData.index;
                contentBlocks[index] = eventData.content_block;
                if (
                  eventData.content_block?.type === 'tool_use' ||
                  eventData.content_block?.type === 'server_tool_use'
                ) {
                  toolInputJsonByIndex[index] = '';
                }

                if (eventData.content_block?.type === 'server_tool_use') {
                  // server tool 事件只走 debug，不污染用户可见输出
                  emitDebug({
                    type: 'server_tool_use_start',
                    name: eventData.content_block.name,
                    index,
                  });
                }
                break;
              }

              case 'content_block_delta': {
                const index: number = eventData.index;
                const delta = eventData.delta;

                // 兜底：有时 delta 先到，先建一个占位 block
                if (!contentBlocks[index]) {
                  if (delta?.type === 'text_delta') {
                    contentBlocks[index] = { type: 'text', text: '' };
                  } else if (delta?.type === 'thinking_delta') {
                    contentBlocks[index] = { type: 'thinking', thinking: '' };
                  } else {
                    contentBlocks[index] = { type: 'unknown' } as ContentBlock;
                  }
                }

                if (delta?.type === 'text_delta') {
                  const text: string = delta.text ?? '';
                  accumulatedText += text;

                  const block: any = contentBlocks[index];
                  block.type = 'text';
                  block.text = (block.text ?? '') + text;
                  // onData 只输出用户可见文本
                  onData(text);
                } else if (delta?.type === 'thinking_delta') {
                  const thinking: string = delta.thinking ?? '';
                  const block: any = contentBlocks[index];
                  block.type = 'thinking';
                  block.thinking = (block.thinking ?? '') + thinking;
                } else if (delta?.type === 'signature_delta') {
                  const signature: string = delta.signature ?? '';
                  const block: any = contentBlocks[index];
                  block.signature = (block.signature ?? '') + signature;
                } else if (delta?.type === 'input_json_delta') {
                  const partialJson: string = delta.partial_json ?? '';
                  toolInputJsonByIndex[index] = (toolInputJsonByIndex[index] ?? '') + partialJson;
                  // 工具参数增量只走 debug，不再走 onData
                  emitDebug({
                    type: 'tool_input_json_delta',
                    index,
                    partial_json: partialJson,
                  });
                }
                break;
              }

              case 'content_block_stop': {
                const index: number = eventData.index;
                const block: any = contentBlocks[index];
                if (
                  (block?.type === 'tool_use' || block?.type === 'server_tool_use') &&
                  toolInputJsonByIndex[index]
                ) {
                  try {
                    block.input = JSON.parse(toolInputJsonByIndex[index]);
                  } catch {
                    // JSON 解析失败时保留原始片段，便于上层排查
                    block.input = block.input ?? toolInputJsonByIndex[index];
                  }
                }
                break;
              }

              case 'message_delta':
                if (streamMessage && eventData.delta) {
                  streamMessage.stop_reason =
                    eventData.delta.stop_reason ?? streamMessage.stop_reason;
                  streamMessage.stop_sequence =
                    eventData.delta.stop_sequence ?? streamMessage.stop_sequence;
                }
                if (streamMessage && eventData.usage) {
                  streamMessage.usage = { ...(streamMessage.usage ?? {}), ...eventData.usage };
                }
                break;

              case 'message_stop':
                // 终止标志只走 debug
                emitDebug({ type: 'message_stop' });
                break;

              default:
                break;
            }
          } catch (parseError) {
            // 解析错误走 debug（上层可选择打印/忽略）
            const message = parseError instanceof Error ? parseError.message : String(parseError);
            emitDebug({
              type: 'sse_json_parse_error',
              error: message,
              raw: jsonStr,
            });
          }
        }
      });

      // 流结束后，把完整消息写入会话历史
      const finalizedBlocks = contentBlocks.filter(Boolean) as ContentBlock[];

      if (finalizedBlocks.length) {
        const assistantMessage = new Message('assistant', finalizedBlocks);
        conversation.addMessage(assistantMessage);

        if (streamMessage) {
          // 尽量还原为 ResponseBody 结构，便于后续调试/工具循环读取
          const responseData: ResponseBody = {
            id: (streamMessage.id as string) ?? '',
            type: 'message',
            role: 'assistant',
            content: finalizedBlocks,
            model: (streamMessage.model as string) ?? body.model,
            stop_reason: (streamMessage.stop_reason as ResponseBody['stop_reason']) ?? null,
            stop_sequence: (streamMessage.stop_sequence as string) ?? null,
            usage:
              (streamMessage.usage as ResponseBody['usage']) ??
              ({ input_tokens: 0, output_tokens: 0 } as ResponseBody['usage']),
            container: streamMessage.container as ResponseBody['container'],
          };
          conversation.rawResponses.push(responseData);
        }
      } else if (accumulatedText) {
        conversation.addMessage(new Message('assistant', accumulatedText));
      }
    } catch (error) {
      console.error('Error calling Claude API stream:', error);
      throw error;
    }
  }
}
