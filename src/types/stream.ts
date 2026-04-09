// 定义用户传入的stream参数类型

export type StreamOptions =
  | { stream?: false; onData?: never }
  | { stream: true; onData: (chunk: string) => void };
