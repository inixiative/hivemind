import type Database from 'better-sqlite3';
import { now } from '../datetime/now';

/**
 * Update an agent's worktree assignment
 */
export function updateAgentWorktree(
  db: Database.Database,
  agentId: string,
  worktreeId: string | null
): boolean {
  const stmt = db.prepare(`
    UPDATE agents
    SET worktree_id = ?, last_heartbeat = ?
    WHERE id = ?
  `);

  const result = stmt.run(worktreeId, now(), agentId);
  return result.changes > 0;
}
