import type Database from 'better-sqlite3';
import type { WorktreeRecord } from './types';

/**
 * Get all registered worktrees
 */
export function getAllWorktrees(db: Database.Database): WorktreeRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM worktrees
    ORDER BY is_main DESC, last_seen DESC
  `);

  return stmt.all() as WorktreeRecord[];
}
