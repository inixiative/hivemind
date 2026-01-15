/**
 * /hm:log - View the hivemind event log
 *
 * Query and display recent events.
 */

import { executeQuery } from '../mcp/tools/query';
import { getGitInfo } from '../git/getGitInfo';

export const logSkill = {
  name: 'hm:log',
  description: 'View recent hivemind events',
  prompt: `Show the recent hivemind event log.

Call hivemind_query and format the results as a readable log:

[timestamp] agent_id: event_type
  content (if any)
  plan: plan_id, task: task_id (if any)

Options:
- Filter by plan, agent, or branch if specified
- Show last N events (default 20)
- Highlight important events (decisions, blocks, completions)

Make it scannable - agents need to quickly catch up on what happened.
`,
};

export type LogInput = {
  planId?: string;
  agentId?: string;
  branch?: string;
  limit?: number;
};

export function executeLog(input: LogInput = {}) {
  const gitInfo = getGitInfo();

  if (!gitInfo.isRepo || !gitInfo.repoName) {
    return {
      error: 'Not in a git repository. Cannot determine project.',
    };
  }

  return executeQuery({
    project: gitInfo.repoName,
    planId: input.planId,
    agentId: input.agentId,
    branch: input.branch,
    limit: input.limit ?? 20,
  });
}
