import type Database from 'better-sqlite3';
import type { Agent } from './types';

/**
 * Get all active agents
 */
export function getActiveAgents(db: Database.Database): Agent[] {
  const stmt = db.prepare(`
    SELECT * FROM agents
    WHERE status = 'active'
    ORDER BY last_heartbeat DESC
  `);

  return stmt.all() as Agent[];
}
