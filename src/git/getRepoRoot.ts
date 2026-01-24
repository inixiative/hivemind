import { execSync } from 'child_process';

/**
 * Get git repository root path
 */
export function getRepoRoot(cwd?: string): string | null {
  try {
    return execSync('git rev-parse --show-toplevel', { stdio: 'pipe', cwd })
      .toString()
      .trim() || null;
  } catch {
    return null;
  }
}
