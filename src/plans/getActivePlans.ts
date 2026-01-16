import type { Database } from 'bun:sqlite';
import type { Plan } from './types';

/**
 * Get all active plans
 */
export function getActivePlans(db: Database): Plan[] {
  const stmt = db.prepare(`
    SELECT * FROM plans
    WHERE status = 'active'
    ORDER BY created_at DESC
  `);

  return stmt.all() as Plan[];
}
