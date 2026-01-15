import { execSync } from 'child_process';

/**
 * Get current git branch name
 */
export function getBranch(): string | null {
  try {
    return execSync('git branch --show-current', { stdio: 'pipe' })
      .toString()
      .trim() || null;
  } catch {
    return null;
  }
}
