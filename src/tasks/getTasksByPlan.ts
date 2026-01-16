import type { Database } from 'bun:sqlite';
import type { Task } from './types';

/**
 * Get all tasks for a plan
 */
export function getTasksByPlan(db: Database, planId: string): Task[] {
  const stmt = db.prepare(`
    SELECT * FROM tasks
    WHERE plan_id = ?
    ORDER BY seq ASC
  `);

  return stmt.all(planId) as Task[];
}
