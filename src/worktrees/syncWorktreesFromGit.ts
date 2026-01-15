import type Database from 'better-sqlite3';
import { getWorktrees as getGitWorktrees } from '../git/getWorktrees';
import { getWorktreeByPath } from './getWorktreeByPath';
import { registerWorktree } from './registerWorktree';
import { updateWorktreeSeen } from './updateWorktreeSeen';
import { updateWorktreeCommit } from './updateWorktreeCommit';
import type { WorktreeRecord } from './types';

/**
 * Sync worktrees from git into the database
 * Returns list of all worktrees after sync
 */
export function syncWorktreesFromGit(db: Database.Database): WorktreeRecord[] {
  const gitWorktrees = getGitWorktrees();
  const results: WorktreeRecord[] = [];

  for (const wt of gitWorktrees) {
    const existing = getWorktreeByPath(db, wt.path);

    if (existing) {
      // Update existing worktree
      updateWorktreeSeen(db, existing.id);
      if (wt.commit && wt.commit !== existing.commit) {
        updateWorktreeCommit(db, existing.id, wt.commit);
      }
      results.push({
        ...existing,
        commit: wt.commit ?? existing.commit,
      });
    } else {
      // Register new worktree
      const record = registerWorktree(db, {
        path: wt.path,
        branch: wt.branch ?? undefined,
        commit: wt.commit,
        isMain: wt.isMain,
      });
      results.push(record);
    }
  }

  return results;
}
