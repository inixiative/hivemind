import type { Database } from 'bun:sqlite';
import type { Agent } from './types';

/**
 * Get all active agents
 */
export function getActiveAgents(db: Database): Agent[] {
  const stmt = db.prepare(`
    SELECT * FROM agents
    WHERE status = 'active'
    ORDER BY created_at DESC
  `);

  return stmt.all() as Agent[];
}
