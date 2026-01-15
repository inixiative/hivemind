import type Database from 'better-sqlite3';
import type { Event } from './types';

/**
 * Get all events since a given sequence number
 *
 * Used for polling: "What happened since I last checked?"
 */
export function getEventsSince(db: Database.Database, sinceSeq: number): Event[] {
  const stmt = db.prepare(`
    SELECT * FROM events
    WHERE seq > ?
    ORDER BY seq ASC
  `);

  return stmt.all(sinceSeq) as Event[];
}
