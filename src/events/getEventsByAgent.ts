import type Database from 'better-sqlite3';
import type { Event } from './types';

/**
 * Get all events for a specific agent
 */
export function getEventsByAgent(db: Database.Database, agentId: string, limit?: number): Event[] {
  const sql = limit
    ? `SELECT * FROM events WHERE agent_id = ? ORDER BY seq DESC LIMIT ?`
    : `SELECT * FROM events WHERE agent_id = ? ORDER BY seq ASC`;

  const stmt = db.prepare(sql);

  if (limit) {
    const results = stmt.all(agentId, limit) as Event[];
    return results.reverse();
  }

  return stmt.all(agentId) as Event[];
}
