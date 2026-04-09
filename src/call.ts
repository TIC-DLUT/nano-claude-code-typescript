// 将请求头等封装在此处
import { Message } from './models/message.ts';
import { HttpClient } from './httpClient.ts';
import { RequestBody, RequestHeader } from './types/request.ts';
import { ResponseBody } from './types/response.ts';
import { Conversation } from './models/conversation.ts';

export class ClaudeCall {
  private httpClient: HttpClient;
  private apiKey: string;
  private readonly API_VERSION = '2023-06-01'; // 统一管理版本号

  constructor(httpClient: HttpClient, apiKey: string) {
    this.httpClient = httpClient;
    this.apiKey = apiKey;
  }

  async call(requestBody: RequestBody, conversation: Conversation): Promise<string> {
    const ctx = this.prepareContext(requestBody, conversation, false);
    return this.callClaude(ctx.endpoint, ctx.body, ctx.headers, conversation);
  }

  async callStream(
    requestBody: RequestBody,
    conversation: Conversation,
    onData: (data: string) => void,
  ): Promise<void> {
    const ctx = this.prepareContext(requestBody, conversation, true);
    return this.callClaudeStream(ctx.endpoint, ctx.body, ctx.headers, conversation, onData);
  }

  private prepareContext(requestBody: RequestBody, conversation: Conversation, stream = false) {
    const endpoint = '/v1/messages';

    const headers: RequestHeader = {
      'x-api-key': this.apiKey,
      'anthropic-version': this.API_VERSION,
      Authorization: `Bearer ${this.apiKey}`,
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

    const body = {
      model: requestBody.model || 'claude-4.6-sonnet',
      messages: messageForAPI,
      max_tokens: requestBody.max_tokens || 4096,
      system: requestBody.system || '',
      tools: requestBody.tools,
      tool_choice: requestBody.tool_choice,
      stream, // 是否启用流式响应
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
    let accumulatedResponse = ''; // 核心：用于拼接完整回复并存入历史
    let buffer = ''; // 用于存储未处理完的 SSE 碎片

    try {
      // 3. 开始执行流式请求
      await this.httpClient.postStream(endpoint, body, headers, (chunk) => {
        buffer += chunk;
        const lines = buffer.split('\n');

        // 保留最后一行，如果它不是完整的 SSE 事件，则在下一次数据到来时继续处理
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();

          // 过滤掉非数据行（如 event: 行、空行、ping 等）
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          // 剥离协议头，获取 JSON 字符串
          const jsonStr = trimmedLine.replace(/^data: /, '');

          try {
            const eventData = JSON.parse(jsonStr);

            // 根据 Claude 协议事件类型分发逻辑
            switch (eventData.type) {
              // 处理最核心的文本增量
              case 'content_block_delta':
                if (eventData.delta?.type === 'text_delta') {
                  const text = eventData.delta.text; // 字段名是 .text
                  accumulatedResponse += text; // 累加到完整结果
                  onData(text); // 实时回调给 UI 渲染
                }
                // 处理代码/工具输入的增量,如展示模型正在写的代码
                else if (eventData.delta?.type === 'input_json_delta') {
                  const partialJson = eventData.delta.partial_json;
                  // 将代码块展示给用户
                  onData(partialJson);
                }
                break;

              // 处理块开始（例如模型开始调用工具）
              case 'content_block_start':
                if (eventData.content_block?.type === 'server_tool_use') {
                  console.log('Claude 正在启动工具调用:', eventData.content_block.name);
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
      if (accumulatedResponse) {
        const assistantMessage = new Message('assistant', accumulatedResponse);
        conversation.addMessage(assistantMessage);
      }
    } catch (error) {
      console.error('调用 Claude API 过程中发生错误:', error);
      throw error; // 向上传递错误，让 UI 层可以展示错误提示
    }
  }
}
