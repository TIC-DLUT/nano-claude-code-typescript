import type { Conversation } from '../models/conversation.ts';
import type { RequestBody } from '../types/request.ts';
import type { Tool } from '../types/tools.ts';
import type { ClaudeStreamDebugEvent } from '../llm/call.ts';

export interface ToolLoopOptions {
  conversation?: Conversation;
  maxTurns?: number;
  tools?: Tool[];
  tool_choice?: RequestBody['tool_choice'];
  onDebug?: (event: ClaudeStreamDebugEvent) => void;
}

export interface ToolLoopResult {
  text: string;
  conversation: Conversation;
  turns: number;
}

export interface RunOptions {
  model?: string;
  maxTurns?: number;
  maxTokens?: number;
  conversation?: Conversation;
  tools?: Tool[];
  tool_choice?: RequestBody['tool_choice'];
  systemPrompt?: string;
  onDebug?: (event: ClaudeStreamDebugEvent) => void;
}

export interface RunResult {
  text: string;
  conversation: Conversation;
  turns: number;
}

export interface Agent {
  run(userText: string, options?: RunOptions): Promise<RunResult>;
  runStream(
    userText: string,
    onData: (chunk: string) => void,
    options?: RunOptions,
  ): Promise<RunResult>;
}
