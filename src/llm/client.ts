import { HttpClient } from './httpClient.ts';
import { ClaudeCall } from './call.ts';
import { RequestBody } from '../types/request.ts';
import { Conversation } from '../models/conversation.ts';
import { ClaudeClientOptions } from '../types/client.ts';

export class ClaudeClient {
  private baseURL: string;
  private apiKey: string;
  private httpClient: HttpClient; // 这里可以替换为具体的HTTP客户端类型
  private caller: ClaudeCall; // 添加 caller 属性
  private defaultConversation: Conversation; // 添加 conversation 属性

  private constructor(baseURL: string, apiKey: string, options?: ClaudeClientOptions) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.httpClient = new HttpClient(baseURL);
    this.caller = new ClaudeCall(this.httpClient, this.apiKey, options); // 在构造函数中初始化 caller 属性
    this.defaultConversation = new Conversation();
  }

  // 静态工厂方法，创建ClaudeClient实例
  static newClaudeClient(
    baseURL: string,
    apiKey: string,
    options?: ClaudeClientOptions,
  ): ClaudeClient {
    // 判断传入的baseURL和apiKey是否有效
    if (!baseURL || !apiKey) {
      throw new Error('Base URL and API key are required to create a ClaudeClient instance.');
    } else if (!/^https?:\/\//.test(baseURL)) {
      throw new Error('Base URL must start with http:// or https://');
    }

    // 兼容用户传入 https://api.anthropic.com/v1 或 https://api.anthropic.com/v1/messages
    const normalizedBaseURL = baseURL
      .replace(/\/+$/, '')
      .replace(/\/v1\/messages$/, '')
      .replace(/\/v1$/, '');

    return new ClaudeClient(normalizedBaseURL, apiKey, options);
  }

  // 提供一个公共方法，让用户可以使用call()方法调用Claude API
  async call(requestBody: RequestBody, conversation?: Conversation): Promise<string> {
    const activeConv = conversation || this.defaultConversation;
    return this.caller.call(requestBody, activeConv);
  }

  //提供一个公共方法，让用户可以使用callStream()方法调用Claude API的流式接口
  async callStream(
    requestBody: RequestBody,
    onData: (chunk: string) => void,
    conversation?: Conversation,
  ): Promise<void> {
    const activeConv = conversation || this.defaultConversation;
    return this.caller.callStream(requestBody, activeConv, onData);
  }
}
