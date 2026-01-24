import { execSync } from 'child_process';

/**
 * Get current git branch name
 */
export function getBranch(cwd?: string): string | null {
  try {
    return execSync('git branch --show-current', { stdio: 'pipe', cwd })
      .toString()
      .trim() || null;
  } catch {
    return null;
  }
}
