/**
 * /hm:join - Join the hivemind for this project
 *
 * Combines setup + register into a single convenient command.
 * Automatically detects git repo, syncs worktrees, and registers agent.
 */

import { executeSetup } from '../mcp/tools/setup';
import { executeRegister } from '../mcp/tools/register';
import { getGitInfo } from '../git/getGitInfo';

export const joinSkill = {
  name: 'hm:join',
  description: 'Join the hivemind for this project',
  prompt: `You are joining the hivemind coordination system.

1. First, detect the project:
   - Check if in a git repo
   - Use repo name as project name, or ask user

2. Initialize hivemind for the project (hivemind_setup)

3. Register yourself as an agent (hivemind_register)
   - Include your session ID if available
   - Add a brief context summary of what you're working on

4. Report back:
   - Your agent ID
   - Project name
   - Current branch/worktree
   - Any other active agents

After joining, you can:
- Use hivemind_emit to share notes, decisions, questions
- Use hivemind_query to see what other agents are doing
- Use hivemind_heartbeat periodically to stay alive
`,
};

export type JoinInput = {
  label?: string;
  context?: string;
};

export function executeJoin(input: JoinInput = {}) {
  const gitInfo = getGitInfo();

  if (!gitInfo.isRepo || !gitInfo.repoName) {
    return {
      needsInput: true,
      message: 'Not in a git repository. Please specify a project name.',
    };
  }

  // Setup
  const setupResult = executeSetup({ project: gitInfo.repoName, useGit: true });
  if (setupResult.needsInput) {
    return setupResult;
  }

  // Register
  const registerResult = executeRegister({
    project: setupResult.project!,
    label: input.label,
    contextSummary: input.context,
  });

  return {
    ...registerResult,
    setupMessage: setupResult.message,
  };
}
