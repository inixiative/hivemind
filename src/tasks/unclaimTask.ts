import type { Database } from 'bun:sqlite';

/**
 * Unclaim a task (release it back to pending)
 */
export function unclaimTask(db: Database, taskId: string): boolean {
  const stmt = db.prepare(`
    UPDATE tasks
    SET status = 'pending', claimed_by = NULL, claimed_at = NULL
    WHERE id = ? AND status IN ('claimed', 'in_progress', 'blocked')
  `);

  const result = stmt.run(taskId);
  return result.changes > 0;
}
