import type { Database } from 'bun:sqlite';

/**
 * Mark an agent as idle (alive but not actively working)
 */
export function markAgentIdle(db: Database, agentId: string): boolean {
  const stmt = db.prepare(`
    UPDATE agents
    SET status = 'idle'
    WHERE id = ?
  `);

  const result = stmt.run(agentId);
  return result.changes > 0;
}
