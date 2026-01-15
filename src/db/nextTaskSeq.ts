import type Database from 'better-sqlite3';

/**
 * Get next task sequence number for a plan
 */
export function nextTaskSeq(db: Database.Database, planId: string): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM tasks
    WHERE plan_id = ?
    AND seq NOT LIKE '%.%'
  `);

  const result = stmt.get(planId) as { count: number };
  return result.count + 1;
}
