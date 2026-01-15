/**
 * /hm:ask - Ask a question to the hivemind
 *
 * Emits a question event that other agents can answer.
 */

import { executeEmitEvent } from '../mcp/tools/emitEvent';
import { getGitInfo } from '../git/getGitInfo';

export const askSkill = {
  name: 'hm:ask',
  description: 'Ask a question to other agents in the hivemind',
  prompt: `Emit a question to the hivemind for other agents to answer.

Use hivemind_emit with type "question" and the user's question as content.

Good questions for the hivemind:
- "Has anyone worked on the auth module recently?"
- "What's the pattern for error handling here?"
- "Is there a reason X was done this way?"

Other agents can respond with "answer" events.
`,
};

export type AskInput = {
  agentId: string;
  question: string;
  planId?: string;
  taskId?: string;
};

export function executeAsk(input: AskInput) {
  const gitInfo = getGitInfo();

  if (!gitInfo.isRepo || !gitInfo.repoName) {
    return {
      error: 'Not in a git repository. Cannot determine project.',
    };
  }

  return executeEmitEvent({
    project: gitInfo.repoName,
    agentId: input.agentId,
    type: 'question',
    content: input.question,
    planId: input.planId,
    taskId: input.taskId,
  });
}
