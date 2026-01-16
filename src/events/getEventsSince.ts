import type { Database } from 'bun:sqlite';
import type { Event } from './types';

/**
 * Get all events since a given point
 *
 * @param since - Either a sequence number (number) or timestamp (string)
 *   - number: Get events with seq > since (exclusive, efficient for polling)
 *   - string: Get events with timestamp > since (for time-based queries)
 *
 * Used for polling: "What happened since I last checked?"
 */
export function getEventsSince(db: Database, since: number | string, limit?: number): Event[] {
  if (typeof since === 'number') {
    // Sequence-based query (most efficient for polling)
    if (limit) {
      const stmt = db.prepare(`
        SELECT * FROM events
        WHERE seq > ?
        ORDER BY seq ASC
        LIMIT ?
      `);
      return stmt.all(since, limit) as Event[];
    }
    const stmt = db.prepare(`
      SELECT * FROM events
      WHERE seq > ?
      ORDER BY seq ASC
    `);
    return stmt.all(since) as Event[];
  } else {
    // Timestamp-based query
    if (limit) {
      const stmt = db.prepare(`
        SELECT * FROM events
        WHERE timestamp > ?
        ORDER BY seq ASC
        LIMIT ?
      `);
      return stmt.all(since, limit) as Event[];
    }
    const stmt = db.prepare(`
      SELECT * FROM events
      WHERE timestamp > ?
      ORDER BY seq ASC
    `);
    return stmt.all(since) as Event[];
  }
}
