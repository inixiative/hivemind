import type Database from 'better-sqlite3';

/**
 * Remove an agent from the hivemind
 */
export function unregisterAgent(db: Database.Database, agentId: string): boolean {
  const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
  const result = stmt.run(agentId);
  return result.changes > 0;
}
