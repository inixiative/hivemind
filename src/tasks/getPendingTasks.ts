import type Database from 'better-sqlite3';
import type { Task } from './types';

/**
 * Get all pending (unclaimed) tasks, optionally filtered by plan
 */
export function getPendingTasks(db: Database.Database, planId?: string): Task[] {
  if (planId) {
    const stmt = db.prepare(`
      SELECT * FROM tasks
      WHERE plan_id = ? AND status = 'pending'
      ORDER BY seq ASC
    `);
    return stmt.all(planId) as Task[];
  }

  const stmt = db.prepare(`
    SELECT * FROM tasks
    WHERE status = 'pending'
    ORDER BY plan_id, seq ASC
  `);
  return stmt.all() as Task[];
}
