import type Database from 'better-sqlite3';
import { now } from '../datetime/now';

/**
 * Update a worktree's current commit
 */
export function updateWorktreeCommit(
  db: Database.Database,
  id: string,
  commit: string
): boolean {
  const stmt = db.prepare(`
    UPDATE worktrees
    SET commit = ?, last_seen = ?
    WHERE id = ?
  `);

  const result = stmt.run(commit, now(), id);
  return result.changes > 0;
}
