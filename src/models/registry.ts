// 模型注册表

export class ModelRegistry {
  private allowList = new Set([
    'claude-sonnet-4-7',
    'claude-sonnet-4-6',
    'claude-sonnet-4-5',
    'claude-opus-4-7',
    'claude-opus-4-6',
    'claude-opus-4-5',
  ]);

  isModelAllowed(model: string): string {
    if (!this.allowList.has(model)) {
      throw new Error(
        `Model "${model}" is not in the allow list. Please choose from: ${Array.from(this.allowList).join(', ')}`,
      );
    }
    return model;
  }
}
