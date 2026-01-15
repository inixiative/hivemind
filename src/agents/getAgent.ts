import type Database from 'better-sqlite3';
import type { Agent } from './types';

/**
 * Get an agent by ID
 */
export function getAgent(db: Database.Database, agentId: string): Agent | null {
  const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
  return (stmt.get(agentId) as Agent) ?? null;
}
