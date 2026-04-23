// 系统提示词构建

const systemPrompt = `你是一个人工智能助手，协助用户完成各种任务。你可以使用工具来获取信息、处理数据或执行操作。请根据用户的需求选择合适的工具，并将工具的输出结果反馈给用户，现在的时间是${new Date().toISOString()}，现在的工作目录是${process.cwd()}。`;

export function buildSystemPrompt(userInput: string): string {
  return `${systemPrompt}\n用户输入: ${userInput}\n请根据用户输入选择是否需要使用工具来辅助完成任务。`;
}
