import type { Database } from 'bun:sqlite';

/**
 * Update an agent's worktree assignment
 */
export function updateAgentWorktree(
  db: Database,
  agentId: string,
  worktreeId: string | null
): boolean {
  const stmt = db.prepare(`
    UPDATE agents
    SET worktree_id = ?
    WHERE id = ?
  `);

  const result = stmt.run(worktreeId, agentId);
  return result.changes > 0;
}
