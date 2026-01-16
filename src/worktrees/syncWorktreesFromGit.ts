import type { Database } from 'bun:sqlite';
import { getWorktrees as getGitWorktrees } from '../git/getWorktrees';
import { getWorktreeByPath } from './getWorktreeByPath';
import { registerWorktree } from './registerWorktree';
import { updateWorktreeSeen } from './updateWorktreeSeen';
import { updateWorktreeCommit } from './updateWorktreeCommit';
import { emit } from '../events/emit';
import type { WorktreeRecord } from './types';

/**
 * Sync worktrees from git into the database
 * Returns list of all worktrees after sync
 */
export function syncWorktreesFromGit(db: Database): WorktreeRecord[] {
  const gitWorktrees = getGitWorktrees();
  const results: WorktreeRecord[] = [];

  for (const wt of gitWorktrees) {
    const existing = getWorktreeByPath(db, wt.path);

    if (existing) {
      // Update existing worktree
      updateWorktreeSeen(db, existing.id);
      if (wt.commit && wt.commit !== existing.commit_hash) {
        updateWorktreeCommit(db, existing.id, wt.commit);
      }
      results.push({
        ...existing,
        commit_hash: wt.commit ?? existing.commit_hash,
      });
    } else {
      // Register new worktree
      const record = registerWorktree(db, {
        path: wt.path,
        branch: wt.branch ?? undefined,
        commit_hash: wt.commit,
        is_main: wt.isMain,
      });

      // Emit worktree:register system event
      emit(db, {
        type: 'worktree:register',
        worktree_id: record.id,
        branch: wt.branch ?? undefined,
        content: `Worktree registered: ${wt.path}${wt.branch ? ` (${wt.branch})` : ''}`,
        metadata: {
          path: wt.path,
          commit_hash: wt.commit,
          is_main: wt.isMain,
        },
      });

      results.push(record);
    }
  }

  return results;
}
