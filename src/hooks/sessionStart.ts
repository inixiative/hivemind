/**
 * Session start hook - auto-join hivemind when starting a Claude session
 *
 * This hook can be installed in Claude Code's settings to automatically
 * register the agent when a new session starts.
 *
 * Installation:
 * Add to your Claude Code settings:
 * {
 *   "hooks": {
 *     "session_start": "npx hivemind hook:session-start"
 *   }
 * }
 */

import { executeJoin } from '../skills/join';
import { getGitInfo } from '../git/getGitInfo';

export function runSessionStartHook() {
  const gitInfo = getGitInfo();

  if (!gitInfo.isRepo) {
    // Not in a git repo, skip auto-join
    return {
      skipped: true,
      reason: 'Not in a git repository',
    };
  }

  try {
    const result = executeJoin({});
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// CLI entry point
if (require.main === module) {
  const result = runSessionStartHook();
  console.log(JSON.stringify(result, null, 2));
}
