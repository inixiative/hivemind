/**
 * /hm:worktree-cleanup - Clean up stale worktrees
 *
 * Removes worktrees from the database that no longer exist on disk.
 */

import { existsSync } from 'fs';
import { getConnection } from '../db/getConnection';
import { getAllWorktrees } from '../worktrees/getAllWorktrees';
import { removeWorktree } from '../worktrees/removeWorktree';
import { emit } from '../events/emit';
import { getGitInfo } from '../git/getGitInfo';

export const worktreeCleanupSkill = {
  name: 'hm:worktree-cleanup',
  description: 'Clean up stale worktrees from hivemind',
  prompt: `Clean up stale worktrees from the hivemind database.

This will:
- Check all registered worktrees
- Remove any whose paths no longer exist on disk
- Emit worktree:stale events for coordination

Use --dry-run to preview without deleting.
`,
};

export type WorktreeCleanupInput = {
  dryRun?: boolean;
};

export type WorktreeCleanupResult = {
  checked: number;
  removed: string[];
  kept: string[];
  dryRun: boolean;
};

export function executeWorktreeCleanup(
  input: WorktreeCleanupInput = {}
): WorktreeCleanupResult {
  const gitInfo = getGitInfo();

  if (!gitInfo.isRepo || !gitInfo.repoName) {
    return {
      checked: 0,
      removed: [],
      kept: [],
      dryRun: input.dryRun ?? false,
    };
  }

  const db = getConnection(gitInfo.repoName);
  const worktrees = getAllWorktrees(db);

  const removed: string[] = [];
  const kept: string[] = [];

  for (const wt of worktrees) {
    const exists = existsSync(wt.path);

    if (!exists) {
      if (!input.dryRun) {
        removeWorktree(db, wt.id);

        // Emit worktree:stale event
        emit(db, {
          type: 'worktree:stale',
          worktree_id: wt.id,
          branch: wt.branch ?? undefined,
          content: `Worktree removed: ${wt.path} (path gone)`,
          metadata: {
            path: wt.path,
            branch: wt.branch,
            last_seen: wt.last_seen,
          },
        });
      }
      removed.push(`${wt.id} (${wt.path})`);
    } else {
      kept.push(`${wt.id} (${wt.path})`);
    }
  }

  return {
    checked: worktrees.length,
    removed,
    kept,
    dryRun: input.dryRun ?? false,
  };
}
