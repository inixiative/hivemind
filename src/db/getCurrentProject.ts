/**
 * Get current project name
 *
 * Priority:
 *   1. HIVEMIND_PROJECT env var
 *   2. Current directory name
 */
export function getCurrentProject(): string {
  if (process.env.HIVEMIND_PROJECT) {
    return process.env.HIVEMIND_PROJECT;
  }

  const cwd = process.cwd();
  return cwd.split('/').pop() || 'default';
}
