import type Database from 'better-sqlite3';
import type { Plan } from './types';

/**
 * Get a plan by ID
 */
export function getPlan(db: Database.Database, planId: string): Plan | null {
  const stmt = db.prepare('SELECT * FROM plans WHERE id = ?');
  return (stmt.get(planId) as Plan) ?? null;
}
