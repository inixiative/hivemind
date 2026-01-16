/**
 * Worktree status values
 */
export type WorktreeStatus = 'active' | 'stale';

/**
 * Worktree record as stored in DB
 */
export type WorktreeRecord = {
  id: string;
  hex: string;
  label: string | null;
  path: string;
  branch: string | null;
  commit_hash: string | null;
  is_main: number;
  status: WorktreeStatus;
  created_at: string;
  last_seen: string | null;
};

/**
 * Input for registering a worktree
 */
export type RegisterWorktreeInput = {
  path: string;
  branch?: string;
  commit_hash?: string;
  is_main?: boolean;
  label?: string;
};
