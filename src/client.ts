import { HttpClient } from './httpclient';

export class ClaudeClient {
  private baseURL: string;
  private apiKey: string;
  private httpClient: HttpClient; // 这里可以替换为具体的HTTP客户端类型

  private constructor() {
    this.baseURL = BACKEND_URL;
    this.apiKey = API_KEY;
    this.httpClient = new HttpClient();
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
}
