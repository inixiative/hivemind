import type { Database } from 'bun:sqlite';

/**
 * Remove a worktree from the database
 * Does NOT delete the actual git worktree - just the DB record
 */
export function removeWorktree(db: Database, worktreeId: string): boolean {
  const stmt = db.prepare('DELETE FROM worktrees WHERE id = ?');
  const result = stmt.run(worktreeId);
  return result.changes > 0;
}
