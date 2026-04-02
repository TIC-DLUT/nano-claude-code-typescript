// 创建httpClient给ClaudeClient使用，封装HTTP请求逻辑,使用原生fetch API(axios最近被投毒了就不用了)

export class HttpClient {
  async get(url: string, headers: Record<string, string> = {}) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });
    return this.handleResponse(response);
  }

  async post(url: string, data: any, headers: Record<string, string> = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    return response.json();
  }
}
