import type { Database } from 'bun:sqlite';
import type { WorktreeRecord } from './types';

/**
 * Get a worktree by ID
 */
export function getWorktreeById(
  db: Database,
  id: string
): WorktreeRecord | null {
  const stmt = db.prepare('SELECT * FROM worktrees WHERE id = ?');
  return (stmt.get(id) as WorktreeRecord) ?? null;
}
