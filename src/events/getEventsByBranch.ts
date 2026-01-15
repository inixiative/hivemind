import type Database from 'better-sqlite3';
import type { Event } from './types';

/**
 * Get events for a specific branch
 */
export function getEventsByBranch(
  db: Database.Database,
  branch: string,
  limit = 100
): Event[] {
  const stmt = db.prepare(`
    SELECT * FROM events
    WHERE branch = ?
    ORDER BY seq DESC
    LIMIT ?
  `);

  return stmt.all(branch, limit) as Event[];
}
