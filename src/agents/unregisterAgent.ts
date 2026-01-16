import type { Database } from 'bun:sqlite';

/**
 * Remove an agent from the hivemind
 */
export function unregisterAgent(db: Database, agentId: string): boolean {
  const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
  const result = stmt.run(agentId);
  return result.changes > 0;
}
