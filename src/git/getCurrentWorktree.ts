import { getWorktrees, type Worktree } from './getWorktrees';

/**
 * Get the worktree for a directory (defaults to process.cwd())
 */
export function getCurrentWorktree(cwd?: string): Worktree | null {
  const targetDir = cwd ?? process.cwd();
  const worktrees = getWorktrees(cwd);

  // Find worktree that contains target directory
  for (const wt of worktrees) {
    if (targetDir.startsWith(wt.path)) {
      return wt;
    }
  }

  return null;
}
