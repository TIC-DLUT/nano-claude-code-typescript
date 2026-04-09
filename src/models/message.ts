// 定义claude信息类
import { ContentBlock } from '../types/response.ts';
import { ResponseBody } from '../types/response.ts';

export class Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];

  constructor(role: 'user' | 'assistant', content: string | ContentBlock[]) {
    this.role = role;
    this.content = content;
  }

  //静态工具，将ResponseBody转换为Message对象
  static fromResponseContent(res: ResponseBody): Message {
    return new Message(res.role, res.content);
  }

  toAPIFormat(): { role: string; content: string } {
    return {
      role: this.role,
      content: this.content,
    };
  }
}
