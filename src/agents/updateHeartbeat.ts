import type Database from 'better-sqlite3';
import { now } from '../datetime/now';

/**
 * Update an agent's heartbeat timestamp
 */
export function updateHeartbeat(db: Database.Database, agentId: string): boolean {
  const stmt = db.prepare(`
    UPDATE agents
    SET last_heartbeat = ?, status = 'active'
    WHERE id = ?
  `);

  const result = stmt.run(now(), agentId);
  return result.changes > 0;
}
