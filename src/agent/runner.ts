import type { RequestBody } from '../types/request.ts';
import type { Tool } from '../types/tools.ts';
import type { ClaudeClient } from '../llm/client.ts';
import { Conversation } from '../models/conversation.ts';
import { getToolsForRequest, sanitizeToolsForRequest } from '../tools/registry.ts';
import { initTools } from '../tools/init.ts';
import { runToolLoop } from './toolLoop.ts';
import type { Agent, RunOptions, ToolLoopOptions, ToolLoopResult } from './types.ts';
import { buildSystemPrompt } from './prompt.ts';

export interface RunnerDefaults {
  model?: string;
  maxTokens?: number;
  maxTurns?: number;
  systemPrompt?: string;
}

// 对工具对象处理，防止有些代理对参数比较严格，像input_example等不能直接传入，需要过滤掉一些字段
function resolveTools(request: RequestBody, options: ToolLoopOptions): Tool[] {
  if (request.tools) return sanitizeToolsForRequest(request.tools);
  if (options.tools) return sanitizeToolsForRequest(options.tools);
  return getToolsForRequest();
}

function resolveToolChoice(
  request: RequestBody,
  options: ToolLoopOptions,
): RequestBody['tool_choice'] {
  return request.tool_choice ?? options.tool_choice ?? { type: 'auto' };
}

export async function runRequestWithTools(
  client: ClaudeClient,
  request: RequestBody,
  options: ToolLoopOptions = {},
): Promise<ToolLoopResult> {
  initTools();
  const conversation = options.conversation ?? new Conversation();
  const tools = resolveTools(request, options);
  const initialToolChoice = resolveToolChoice(request, options);
  const maxTurns = options.maxTurns ?? 8;

  return runToolLoop({
    client,
    request,
    conversation,
    tools,
    initialToolChoice,
    maxTurns,
  });
}

export async function runRequestStreamWithTools(
  client: ClaudeClient,
  request: RequestBody,
  onData: (chunk: string) => void,
  options: ToolLoopOptions = {},
): Promise<ToolLoopResult> {
  initTools();
  const conversation = options.conversation ?? new Conversation();
  const tools = resolveTools(request, options);
  const initialToolChoice = resolveToolChoice(request, options);
  const maxTurns = options.maxTurns ?? 8;

  return runToolLoop({
    client,
    request,
    conversation,
    tools,
    initialToolChoice,
    maxTurns,
    onData,
    onDebug: options.onDebug,
  });
}

export function createRunner(client: ClaudeClient, defaults: RunnerDefaults = {}): Agent {
  return {
    async run(userText: string, options: RunOptions = {}) {
      const request: RequestBody = {
        model: options.model ?? defaults.model,
        messages: [{ role: 'user', content: userText }],
        max_tokens: options.maxTokens ?? defaults.maxTokens ?? 1024,
        tools: options.tools,
        tool_choice: options.tool_choice,
        system: options.systemPrompt ?? defaults.systemPrompt ?? buildSystemPrompt(),
      };

      return runRequestWithTools(client, request, {
        conversation: options.conversation,
        maxTurns: options.maxTurns ?? defaults.maxTurns,
        tools: options.tools,
        tool_choice: options.tool_choice,
      });
    },

    async runStream(userText: string, onData: (chunk: string) => void, options: RunOptions = {}) {
      const request: RequestBody = {
        model: options.model ?? defaults.model,
        messages: [{ role: 'user', content: userText }],
        max_tokens: options.maxTokens ?? defaults.maxTokens ?? 1024,
        tools: options.tools,
        tool_choice: options.tool_choice,
        system: options.systemPrompt ?? defaults.systemPrompt ?? buildSystemPrompt(),
      };

      return runRequestStreamWithTools(client, request, onData, {
        conversation: options.conversation,
        maxTurns: options.maxTurns ?? defaults.maxTurns,
        tools: options.tools,
        tool_choice: options.tool_choice,
        onDebug: options.onDebug,
      });
    },
  };
}
