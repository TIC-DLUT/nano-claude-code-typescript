// 创建httpClient给ClaudeClient使用，封装HTTP请求逻辑,使用原生fetch API(axios最近被投毒了就不用了)

export class HttpClient {
  /**
   * 通用的 POST 请求方法
   * @param url 请求地址
   * @param data 发送的 JSON 数据
   * @param headers 包含鉴权和其他信息的请求头
   */

  // 增加泛型，让调用者可以指定返回数据的类型，提升类型安全性
  async post<T>(
    url: string,
    data: any,
    headers: Record<string, string> = {},
    timeout: number = 10000,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout); // 设置请求超时时间为10秒
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
        signal: controller.signal, // 关联 AbortController 的 signal
      });

      clearTimeout(timeoutId); // 请求完成后清除超时定时器
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId); // 请求失败时也清除超时定时器
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('HTTP POST 请求超时:', error);
        throw new Error('请求超时，请稍后再试');
      }
      console.error('HTTP POST 请求失败:', error);
      throw error;
    }
  }

  async get<T>(
    url: string,
    headers: Record<string, string> = {},
    timeout: number = 10000,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('HTTP GET 请求超时:', error);
        throw new Error('请求超时，请稍后再试');
      }
      console.error('HTTP GET 请求失败:', error);
      throw error;
    }
  }
}
