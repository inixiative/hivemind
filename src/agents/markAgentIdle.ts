import type Database from 'better-sqlite3';
import { now } from '../datetime/now';

/**
 * Mark an agent as idle (alive but not actively working)
 */
export function markAgentIdle(db: Database.Database, agentId: string): boolean {
  const stmt = db.prepare(`
    UPDATE agents
    SET status = 'idle', last_heartbeat = ?
    WHERE id = ?
  `);

  const result = stmt.run(now(), agentId);
  return result.changes > 0;
}
