import type { Database } from 'bun:sqlite';

/**
 * Mark a task as blocked
 */
export function blockTask(
  db: Database,
  taskId: string,
  reason?: string
): boolean {
  const stmt = db.prepare(`
    UPDATE tasks
    SET status = 'blocked'
    WHERE id = ? AND status IN ('claimed', 'in_progress')
  `);

  const result = stmt.run(taskId);
  return result.changes > 0;
}
