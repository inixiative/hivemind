import type Database from 'better-sqlite3';
import type { Plan } from './types';

/**
 * Get all active plans
 */
export function getActivePlans(db: Database.Database): Plan[] {
  const stmt = db.prepare(`
    SELECT * FROM plans
    WHERE status = 'active'
    ORDER BY created_at DESC
  `);

  return stmt.all() as Plan[];
}
