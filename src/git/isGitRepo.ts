import { execSync } from 'child_process';

/**
 * Check if current directory is inside a git repo
 */
export function isGitRepo(): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}
