// 工具循环
import { RequestBody } from '../types/request.ts';
import { Conversation } from '../models/conversation.ts';
import type { ToolResultBlock, ToolUseBlock } from '../types/response.ts';

interface LoopDeps {
  callOnce: (req: RequestBody, conv: Conversation) => Promise<string | void>;
  readLatestText: (conv: Conversation) => string;
}

function getLatestToolUses(conversation: Conversation): ToolUseBlock[] {
  const latest = conversation.rawResponses[conversation.rawResponses.length - 1];
  if (!latest) return [];
  return latest.content.filter((b: any) => b?.type === 'tool_use') as ToolUseBlock[];
}

function normalizeToolResultContent(result: any): string {
  if (typeof result === 'string') return result;
  try {
    return JSON.stringify(result);
  } catch {
    return String(result);
  }
}

async function buildToolResults(toolUses: ToolUseBlock[]): Promise<ToolResultBlock[]> {
  const results: ToolResultBlock[] = [];

  for (const toolUse of toolUses) {
    try {
      const output = await executeTool(toolUse.name, toolUse.input);
      results.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: normalizeToolResultContent(output),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: message,
        is_error: true,
      });
    }
  }

  return results;
}

export async function runToolLoop(
  deps: LoopDeps,
  initialRequest: RequestBody,
  conversation: Conversation,
  maxTurns = 8,
): Promise<RunResult> {
  let messagesToSync = initialRequest.messages || [];
  let latestText = '';

  for (let turn = 0; turn < maxTurns; turn++) {
    const req: RequestBody = {
      ...initialRequest,
      messages: messagesToSync,
    };
    const out = await deps.callOnce(req, conversation);
    if (typeof out === 'string') {
      latestText = out;
    }
    const toolUses = getLatestToolUses(conversation);
    if (toolUses.length === 0) {
      // 没有工具调用了，继续下一轮对话
      return {
        text: latestText || deps.readLatestText(conversation),
        conversation,
        turns: turn,
      };
    }
    const toolResults = await buildToolResults(toolUses);
    // 将工具结果添加到对话中，供下一轮调用
    toolResults.forEach((res) => conversation.addMessage(res));
    // 准备下一轮的输入消息
    messagesToSync = conversation.history.map((msg) => msg.toRequestMessage());
  }
  throw new Error('Exceeded maximum tool loop turns');
}
