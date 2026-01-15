import { execSync } from 'child_process';

/**
 * Get git repository root path
 */
export function getRepoRoot(): string | null {
  try {
    return execSync('git rev-parse --show-toplevel', { stdio: 'pipe' })
      .toString()
      .trim() || null;
  } catch {
    return null;
  }
}
