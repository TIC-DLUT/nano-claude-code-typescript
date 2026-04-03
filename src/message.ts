// 定义claude信息类

export class Message {
  role: 'user' | 'assistant' | 'system';
  content: string;

  constructor(role: 'user' | 'assistant' | 'system', content: string) {
    this.role = role;
    this.content = content;
  }
}
