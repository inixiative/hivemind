/**
 * /hm:say - Quick emit a note to the hivemind
 *
 * Shorthand for emitting a note event.
 */

import { executeEmitEvent } from '../mcp/tools/emitEvent';
import { getGitInfo } from '../git/getGitInfo';

export const saySkill = {
  name: 'hm:say',
  description: 'Say something to the hivemind (emit a note)',
  prompt: `Emit a note to the hivemind so other agents can see it.

Use hivemind_emit with type "note" and the user's message as content.

This is for informal communication between agents:
- Status updates
- Discoveries
- Warnings
- General notes

Keep it brief and useful for other agents.
`,
};

export type SayInput = {
  agentId: string;
  message: string;
  planId?: string;
  taskId?: string;
};

export function executeSay(input: SayInput) {
  const gitInfo = getGitInfo();

  if (!gitInfo.isRepo || !gitInfo.repoName) {
    return {
      error: 'Not in a git repository. Cannot determine project.',
    };
  }

  return executeEmitEvent({
    project: gitInfo.repoName,
    agentId: input.agentId,
    type: 'note',
    content: input.message,
    planId: input.planId,
    taskId: input.taskId,
  });
}
