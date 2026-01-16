import type { Database } from 'bun:sqlite';
import type { Event } from './types';

/**
 * Get events for a specific worktree
 */
export function getEventsByWorktree(
  db: Database,
  worktreeId: string,
  limit = 100
): Event[] {
  const stmt = db.prepare(`
    SELECT * FROM events
    WHERE worktree_id = ?
    ORDER BY seq DESC
    LIMIT ?
  `);

  return stmt.all(worktreeId, limit) as Event[];
}
