import { execSync } from 'child_process';

export type Worktree = {
  path: string;
  branch: string | null;
  commit: string;
  isMain: boolean;
};

/**
 * Get all git worktrees for the repository
 */
export function getWorktrees(cwd?: string): Worktree[] {
  try {
    const output = execSync('git worktree list --porcelain', { stdio: 'pipe', cwd })
      .toString()
      .trim();

    if (!output) return [];

    const worktrees: Worktree[] = [];
    let current: Partial<Worktree> = {};

    for (const line of output.split('\n')) {
      if (line.startsWith('worktree ')) {
        if (current.path) {
          worktrees.push(current as Worktree);
        }
        current = { path: line.slice(9), isMain: worktrees.length === 0 };
      } else if (line.startsWith('HEAD ')) {
        current.commit = line.slice(5);
      } else if (line.startsWith('branch ')) {
        current.branch = line.slice(7).replace('refs/heads/', '');
      } else if (line === 'detached') {
        current.branch = null;
      }
    }

    if (current.path) {
      worktrees.push(current as Worktree);
    }

    return worktrees;
  } catch {
    return [];
  }
}
