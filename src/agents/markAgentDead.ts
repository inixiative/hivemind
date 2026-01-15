import type Database from 'better-sqlite3';

/**
 * Mark an agent as dead (no longer responding)
 */
export function markAgentDead(db: Database.Database, agentId: string): boolean {
  const stmt = db.prepare(`
    UPDATE agents
    SET status = 'dead'
    WHERE id = ?
  `);

  const result = stmt.run(agentId);
  return result.changes > 0;
}
