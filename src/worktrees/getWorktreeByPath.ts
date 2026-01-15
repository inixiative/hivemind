import type Database from 'better-sqlite3';
import type { WorktreeRecord } from './types';

/**
 * Get a worktree by its filesystem path
 */
export function getWorktreeByPath(
  db: Database.Database,
  path: string
): WorktreeRecord | null {
  const stmt = db.prepare('SELECT * FROM worktrees WHERE path = ?');
  return (stmt.get(path) as WorktreeRecord) ?? null;
}
