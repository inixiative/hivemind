import type { Database } from 'bun:sqlite';
import { registerWorktree } from '../../worktrees/registerWorktree';
import type { WorktreeRecord } from '../../worktrees/types';

let worktreeSeq = 0;

export type WorktreeOverrides = {
  path?: string;
  branch?: string;
  commit_hash?: string;
  is_main?: boolean;
  label?: string;
};

export function buildWorktree(db: Database, overrides: WorktreeOverrides = {}): WorktreeRecord {
  worktreeSeq++;
  return registerWorktree(db, {
    path: overrides.path ?? `/test/worktree-${worktreeSeq}`,
    branch: overrides.branch,
    commit_hash: overrides.commit_hash,
    is_main: overrides.is_main ?? false,
    label: overrides.label,
  });
}

export function resetWorktreeSequence() {
  worktreeSeq = 0;
}
