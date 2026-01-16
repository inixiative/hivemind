import type { Database } from 'bun:sqlite';
import { now } from '../datetime/now';

/**
 * Update a worktree's last_seen timestamp
 */
export function updateWorktreeSeen(db: Database, id: string): boolean {
  const stmt = db.prepare(`
    UPDATE worktrees
    SET last_seen = ?, status = 'active'
    WHERE id = ?
  `);

  const result = stmt.run(now(), id);
  return result.changes > 0;
}
