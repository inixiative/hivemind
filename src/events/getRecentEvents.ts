import type Database from 'better-sqlite3';
import type { Event } from './types';

/**
 * Get the most recent events
 */
export function getRecentEvents(db: Database.Database, limit: number = 50): Event[] {
  const stmt = db.prepare(`
    SELECT * FROM events
    ORDER BY seq DESC
    LIMIT ?
  `);

  const results = stmt.all(limit) as Event[];
  return results.reverse(); // Chronological order
}
