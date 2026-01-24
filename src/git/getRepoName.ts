import { execSync } from 'child_process';

/**
 * Get repository name from git remote or directory
 */
export function getRepoName(cwd?: string): string | null {
  try {
    // Try to get from remote origin
    const remote = execSync('git remote get-url origin', { stdio: 'pipe', cwd })
      .toString()
      .trim();

    // Extract repo name from URL
    // git@github.com:user/repo.git -> repo
    // https://github.com/user/repo.git -> repo
    const match = remote.match(/\/([^/]+?)(\.git)?$/);
    if (match) {
      return match[1];
    }
  } catch {
    // No remote, try repo root directory name
    try {
      const root = execSync('git rev-parse --show-toplevel', { stdio: 'pipe', cwd })
        .toString()
        .trim();
      return root.split('/').pop() || null;
    } catch {
      return null;
    }
  }

  return null;
}
