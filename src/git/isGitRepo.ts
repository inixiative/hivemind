import { execSync } from 'child_process';

/**
 * Check if directory is inside a git repo
 */
export function isGitRepo(cwd?: string): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe', cwd });
    return true;
  } catch {
    return false;
  }
}
