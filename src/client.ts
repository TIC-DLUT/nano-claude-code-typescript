import { HttpClient } from './httpClient.ts';
import { ClaudeCall } from './call.ts';
import { RequestBody } from './types/request.ts';
import { Conversation } from './models/conversation.ts';

export class ClaudeClient {
  private apiKey: string;
  private httpClient: HttpClient; // 这里可以替换为具体的HTTP客户端类型
  private caller: ClaudeCall; // 添加 caller 属性
  private defaultConversation: Conversation; // 添加 conversation 属性

  private constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.httpClient = new HttpClient(baseURL);
    this.caller = new ClaudeCall(this.httpClient); // 在构造函数中初始化 caller 属性，并传入当前 ClaudeClient 实例
    this.defaultConversation = new Conversation();
  }

  // 静态工厂方法，创建ClaudeClient实例
  static newClaudeClient(baseURL: string, apiKey: string): ClaudeClient {
    // 判断传入的baseURL和apiKey是否有效
    if (!baseURL || !apiKey) {
      throw new Error('Base URL and API key are required to create a ClaudeClient instance.');
    } else if (!/^https?:\/\//.test(baseURL)) {
      throw new Error('Base URL must start with http:// or https://');
    }

    return new ClaudeClient(baseURL, apiKey);
  }

  // 提供一个公共方法，让用户可以使用call()方法调用Claude API
  async call(requestBody: RequestBody, conversation?: Conversation): Promise<string> {
    const activeConv = conversation || this.defaultConversation;
    return this.caller.callClaude(this.apiKey, requestBody, activeConv);
  }

  //提供一个公共方法，让用户可以使用callStream()方法调用Claude API的流式接口
  async callStream(
    requestBody: RequestBody,
    onData: (chunk: string) => void,
    conversation?: Conversation,
  ): Promise<void> {
    const activeConv = conversation || this.defaultConversation;
    return this.caller.callClaudeStream(this.apiKey, requestBody, activeConv, onData);
  }
}
