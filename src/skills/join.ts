/**
 * /hm:join - Join the hivemind for this project
 *
 * Combines setup + register into a single convenient command.
 * Automatically detects git repo, syncs worktrees, and registers agent.
 * Also ensures the coordinator singleton is running.
 */

import { executeSetup } from '../mcp/tools/setup';
import { executeRegister } from '../mcp/tools/register';
import { getGitInfo } from '../git/getGitInfo';
import { ensureCoordinator } from '../coordinator/spawn';
import { getProjectPaths } from '../db/getProjectPaths';

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
- Use TodoWrite normally - your todos auto-sync to hivemind plans

Your agent lifecycle is tracked by PID - no heartbeats needed.
`,
};

export type JoinInput = {
  label?: string;
  context?: string;
  sessionId?: string;
  pid?: number;
};

export type JoinResult =
  | { needsInput: true; message: string }
  | {
      needsInput?: false;
      agentId: string;
      project: string;
      worktreeId?: string;
      branch?: string;
      message: string;
      setupMessage?: string;
    };

export function executeJoin(input: JoinInput = {}): JoinResult {
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
    return {
      needsInput: true,
      message: setupResult.message ?? 'Setup requires input',
    };
  }

  // Register
  const registerResult = executeRegister({
    project: setupResult.project!,
    label: input.label,
    sessionId: input.sessionId,
    pid: input.pid,
    contextSummary: input.context,
  });

  // Ensure coordinator singleton is running (upsert)
  const paths = getProjectPaths(setupResult.project!);
  ensureCoordinator({
    project: setupResult.project!,
    dataDir: paths.projectDir,
  });

  return {
    ...registerResult,
    setupMessage: setupResult.message,
  };
}
