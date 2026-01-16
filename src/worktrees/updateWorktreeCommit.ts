import type { Database } from 'bun:sqlite';
import { now } from '../datetime/now';

/**
 * Update a worktree's current commit
 */
export function updateWorktreeCommit(
  db: Database,
  id: string,
  commitHash: string
): boolean {
  const stmt = db.prepare(`
    UPDATE worktrees
    SET commit_hash = ?, last_seen = ?
    WHERE id = ?
  `);

  const result = stmt.run(commitHash, now(), id);
  return result.changes > 0;
}
