/**
 * hivemind_worktree_cleanup - Clean up stale worktrees
 */

import { existsSync } from 'fs';
import { getConnection } from '../../db/getConnection';
import { getAllWorktrees } from '../../worktrees/getAllWorktrees';
import { removeWorktree } from '../../worktrees/removeWorktree';
import { emit } from '../../events/emit';

export const worktreeCleanupTool = {
  name: 'hivemind_worktree_cleanup',
  description: 'Clean up stale worktrees from hivemind database',
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    type: 'object' as const,
    properties: {
      project: {
        type: 'string',
        description: 'Project name',
      },
      dryRun: {
        type: 'boolean',
        description: 'Preview without deleting',
      },
    },
    required: ['project'],
  },
};

export type WorktreeCleanupInput = {
  project: string;
  dryRun?: boolean;
};

export type WorktreeCleanupResult = {
  checked: number;
  removed: string[];
  kept: string[];
  dryRun: boolean;
};

export function executeWorktreeCleanup(
  input: WorktreeCleanupInput
): WorktreeCleanupResult {
  const db = getConnection(input.project);
  const worktrees = getAllWorktrees(db);

  const removed: string[] = [];
  const kept: string[] = [];

  for (const wt of worktrees) {
    const exists = existsSync(wt.path);

    if (!exists) {
      if (!input.dryRun) {
        removeWorktree(db, wt.id);

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
