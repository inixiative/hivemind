import type { Database } from 'bun:sqlite';
import type { WorktreeRecord } from './types';

/**
 * Get all registered worktrees
 */
export function getAllWorktrees(db: Database): WorktreeRecord[] {
  const stmt = db.prepare(`
    SELECT * FROM worktrees
    ORDER BY is_main DESC, last_seen DESC
  `);

  return stmt.all() as WorktreeRecord[];
}
