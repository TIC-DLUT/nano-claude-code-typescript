export interface Tool {
  name: string;
  description: string; // claude工具的描述信息
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };

  input_example?: Array<{ name?: string; input: Record<string, any> }>; // 可选：工具输入示例，帮助模型理解如何调用工具

  cache_control?: {
    type: 'ephemeral';
  };
}
