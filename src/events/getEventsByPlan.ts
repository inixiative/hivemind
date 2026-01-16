import type { Database } from 'bun:sqlite';
import type { Event } from './types';

/**
 * Get all events for a specific plan
 */
export function getEventsByPlan(db: Database, planId: string, limit?: number): Event[] {
  const sql = limit
    ? `SELECT * FROM events WHERE plan_id = ? ORDER BY seq DESC LIMIT ?`
    : `SELECT * FROM events WHERE plan_id = ? ORDER BY seq ASC`;

  const stmt = db.prepare(sql);

  if (limit) {
    const results = stmt.all(planId, limit) as Event[];
    return results.reverse(); // Return in chronological order
  }

  return stmt.all(planId) as Event[];
}
