/**
 * /hm:reset - Reset hivemind database
 *
 * Deletes the database and recreates with fresh schema.
 * Use for schema migrations or starting fresh.
 */

import { executeReset } from '../mcp/tools/reset';
import { getGitInfo } from '../git/getGitInfo';

export const resetSkill = {
  name: 'hm:reset',
  description: 'Reset hivemind database (destructive!)',
  prompt: `Reset the hivemind database for this project.

**WARNING: This is destructive!** It will:
- Delete all agents, plans, tasks, and events
- Delete the database file
- Recreate with fresh schema

This is useful for:
- Schema migrations (after changing schema.sql)
- Starting fresh on a project
- Clearing corrupted data

Call hivemind_reset with confirm: true to proceed.

After reset, you will need to re-register as an agent.
`,
};

export type ResetInput = {
  confirm?: boolean;
};

export function executeResetSkill(input: ResetInput = {}) {
  const gitInfo = getGitInfo();

  if (!gitInfo.isRepo || !gitInfo.repoName) {
    return {
      error: 'Not in a git repository. Cannot determine project.',
    };
  }

  return executeReset({
    project: gitInfo.repoName,
    confirm: input.confirm ?? false,
  });
}
