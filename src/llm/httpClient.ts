// 创建httpClient给ClaudeClient使用，封装HTTP请求逻辑,使用原生fetch API(axios最近被投毒了就不用了)

export class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    // 去除baseUrl末尾的斜杠，确保URL拼接正确
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private buildUrl(endpoint: string): string {
    // 确保endpoint以斜杠开头，避免拼接错误
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${normalizedEndpoint}`;
  }

  // 提取post和postStream中重复的逻辑，避免重复代码，复用已有的buildUrl方法
  private async executeFetch(
    endpoint: string,
    options: RequestInit,
    timeout: number = 30000,
  ): Promise<Response> {
    const url = this.buildUrl(endpoint);
    const controller = new AbortController(); // 创建一个AbortController实例，用于控制请求的取消
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal, // 将AbortController的signal传递给fetch，以便在超时时取消请求
        headers: {
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('HTTP 请求超时:', error);
        throw new Error('请求超时，请稍后再试');
      }
      console.error('HTTP 请求失败:', error);
      throw error;
    }
  }

  // 封装POST请求，复用executeFetch方法
  async post<T>(
    endpoint: string,
    data: any,
    headers: Record<string, string> = {},
    timeout?: number,
  ): Promise<T> {
    const response = await this.executeFetch(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers,
      },
      timeout,
    );
    return (await response.json()) as T;
  }

  // 封装流式POST请求，复用executeFetch方法
  async postStream(
    endpoint: string,
    data: any,
    headers: Record<string, string> = {},
    onData: (chunk: string) => void,
    timeout?: number,
  ): Promise<void> {
    const response = await this.executeFetch(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers,
      },
      timeout,
    );

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      onData(chunk);
    }
  }

  // 封装GET请求，复用executeFetch方法
  async Get<T>(
    endpoint: string,
    headers: Record<string, string> = {},
    timeout?: number,
  ): Promise<T> {
    const response = await this.executeFetch(endpoint, { method: 'GET', headers }, timeout);
    return (await response.json()) as T;
  }
}
