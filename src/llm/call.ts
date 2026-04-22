// 将请求头等封装在此处
import { Message } from '../models/message.ts';
import { HttpClient } from './httpClient.ts';
import { RequestBody, RequestHeader } from '../types/request.ts';
import { ContentBlock, ResponseBody } from '../types/response.ts';
import { Conversation } from '../models/conversation.ts';
import { ClaudeClientOptions } from '../types/client.ts';

export class ClaudeCall {
  private httpClient: HttpClient;
  private apiKey: string;
  private apiVersion: string;
  private betas: string[];
  private defaultHeaders: Record<string, string>;
  private sendAuthorizationHeader: boolean;

  constructor(httpClient: HttpClient, apiKey: string, options?: ClaudeClientOptions) {
    this.httpClient = httpClient;
    this.apiKey = apiKey;
    this.apiVersion = options?.apiVersion ?? '2023-06-01';
    this.betas = options?.betas ?? [];
    this.defaultHeaders = options?.defaultHeaders ?? {};
    this.sendAuthorizationHeader = options?.sendAuthorizationHeader ?? true;
  }

  async call(requestBody: RequestBody, conversation: Conversation): Promise<string> {
    const ctx = this.prepareContext({ ...requestBody, stream: false }, conversation);
    return this.callClaude(ctx.endpoint, ctx.body, ctx.headers, conversation);
  }

  async callStream(
    requestBody: RequestBody,
    conversation: Conversation,
    onData: (data: string) => void,
  ): Promise<void> {
    const ctx = this.prepareContext({ ...requestBody, stream: true }, conversation);
    return this.callClaudeStream(ctx.endpoint, ctx.body, ctx.headers, conversation, onData);
  }

  private prepareContext(requestBody: RequestBody, conversation: Conversation) {
    const endpoint = '/v1/messages';

    const headers: RequestHeader = {
      'x-api-key': this.apiKey,
      'anthropic-version': this.apiVersion,
      'Content-Type': 'application/json',
      ...(this.betas.length ? { 'anthropic-beta': this.betas.join(',') } : {}),
      ...(this.sendAuthorizationHeader ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      ...this.defaultHeaders,
    };

    // 1. 同步当前请求的消息到本地对话历史（如果是新消息）
    requestBody.messages.forEach((msg) => {
      const isAlreadyInHistory = conversation.history.some(
        (h) => h.role === msg.role && h.content === msg.content,
      );
      if (!isAlreadyInHistory) {
        const messageInstance = msg instanceof Message ? msg : new Message(msg.role, msg.content);
        conversation.addMessage(messageInstance);
      }
    });

    // 2. 构造发送给 API 的完整历史上下文
    const messageForAPI = conversation.history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const body: RequestBody = {
      ...requestBody,
      // 兜底：避免用户传空值导致 400
      model: requestBody.model || 'claude-sonnet-4-6',
      max_tokens: requestBody.max_tokens || 4096,
      messages: messageForAPI,
      stream: requestBody.stream, // 是否启用流式响应
    };

    return { endpoint, headers, body };
  }

  // 实现普通的非流式调用
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

  //实现流式传输
  async callClaudeStream(
    endpoint: string,
    body: RequestBody,
    headers: RequestHeader,
    conversation: Conversation,
    onData: (data: string) => void,
  ): Promise<void> {
    let accumulatedText = ''; // 用于拼接完整文本回复
    let buffer = ''; // 用于存储未处理完的 SSE 碎片

    // 用于还原流式响应为 content blocks（保持 tool_use / thinking 等信息）
    const contentBlocks: Array<ContentBlock | undefined> = [];
    const toolInputJsonByIndex: Record<number, string> = {};
    let streamMessage: Partial<ResponseBody> | undefined;

    try {
      // 3. 开始执行流式请求
      await this.httpClient.postStream(endpoint, body, headers, (chunk) => {
        buffer += chunk;
        const lines = buffer.split(/\r?\n/);

        // 保留最后一行，如果它不是完整的 SSE 事件，则在下一次数据到来时继续处理
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();

          // 过滤掉非数据行（如 event: 行、空行、ping 等）
          if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

          // 剥离协议头，获取 JSON 字符串
          const jsonStr = trimmedLine.replace(/^data:\s*/, '');
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const eventData = JSON.parse(jsonStr);

            // 根据 Claude 协议事件类型分发逻辑
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
                // 仅做信息提示，不影响逻辑
                if (eventData.content_block?.type === 'server_tool_use') {
                  console.log('Claude 正在启动 server tool:', eventData.content_block.name);
                }
                break;
              }

              // 处理最核心的文本增量
              case 'content_block_delta':
                {
                  const index: number = eventData.index;
                  const delta = eventData.delta;

                  // 兜底：有些情况下 delta 可能先到，这里确保对应 block 存在
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

                    onData(text); // 实时回调给 UI 渲染
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

                    // 保持向后兼容：仍然把 tool input 的增量抛给调用方
                    onData(partialJson);
                  }
                }
                break;

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
                    // 保留原始 JSON 字符串，方便上层排查
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

              // 识别claude官方终止标志
              case 'message_stop':
                console.log('Claude 响应生成完毕。');
                break;

              default:
                // 其他事件（message_start, content_block_stop 等）视业务需求处理
                break;
            }
          } catch (parseError) {
            console.error('JSON 解析失败:', parseError, jsonStr);
          }
        }
      });

      // 流彻底结束后，将 AI 的完整回复存入 Conversation 历史
      const finalizedBlocks = contentBlocks.filter(Boolean) as ContentBlock[];

      if (finalizedBlocks.length) {
        const assistantMessage = new Message('assistant', finalizedBlocks);
        conversation.addMessage(assistantMessage);

        // 尽量还原成 ResponseBody 形态，便于调试
        if (streamMessage) {
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
      console.error('调用 Claude API 过程中发生错误:', error);
      throw error; // 向上传递错误，让 UI 层可以展示错误提示
    }
  }
}
