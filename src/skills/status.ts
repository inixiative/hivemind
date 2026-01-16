/**
 * /hm:status - Show hivemind status
 *
 * Shows active agents, recent events, and worktrees.
 */

import { executeStatus } from '../mcp/tools/status';
import { getGitInfo } from '../git/getGitInfo';
import { formatDatetime } from '../datetime/formatDatetime';

export const statusSkill = {
  name: 'hm:status',
  description: 'Show current hivemind status',
  prompt: `Show the current hivemind status for this project.

Call hivemind_status and present the results clearly:

1. **Active Agents** - Who else is working
   - Agent ID, label, current task
   - PID (process ID)
   - What they're working on (context_summary)

2. **Worktrees** - Git worktrees being used
   - Path, branch, main or not

3. **Recent Activity** - Last few events
   - Who, what, when
   - Filter to important events (decisions, completions, blocks)

Format for easy scanning. Highlight anything that needs attention.
`,
};

export function executeStatusSkill() {
  const gitInfo = getGitInfo();

  if (!gitInfo.isRepo || !gitInfo.repoName) {
    return {
      error: 'Not in a git repository. Cannot determine project.',
    };
  }

  return executeStatus({ project: gitInfo.repoName });
}
