import type { Database } from 'bun:sqlite';
import { now } from '../datetime/now';

/**
 * Heartbeat/lease update for an active agent.
 */
export function touchAgent(db: Database, agentId: string): boolean {
  const stmt = db.prepare(`
    UPDATE agents
    SET last_seen_at = ?, status = 'active'
    WHERE id = ? AND status != 'dead'
  `);

  const result = stmt.run(now(), agentId);
  return result.changes > 0;
}
