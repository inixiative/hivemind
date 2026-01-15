import type Database from 'better-sqlite3';
import type { PlanStatus } from './types';

/**
 * Update a plan's status
 */
export function updatePlanStatus(
  db: Database.Database,
  planId: string,
  status: PlanStatus
): boolean {
  const stmt = db.prepare('UPDATE plans SET status = ? WHERE id = ?');
  const result = stmt.run(status, planId);
  return result.changes > 0;
}
