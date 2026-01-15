import { getWorktrees, type Worktree } from './getWorktrees';

/**
 * Get the worktree for current directory
 */
export function getCurrentWorktree(): Worktree | null {
  const cwd = process.cwd();
  const worktrees = getWorktrees();

  // Find worktree that contains current directory
  for (const wt of worktrees) {
    if (cwd.startsWith(wt.path)) {
      return wt;
    }
  }

  return null;
}
