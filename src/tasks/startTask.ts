import type Database from 'better-sqlite3';

/**
 * Mark a task as in_progress
 */
export function startTask(db: Database.Database, taskId: string): boolean {
  const stmt = db.prepare(`
    UPDATE tasks
    SET status = 'in_progress'
    WHERE id = ? AND status = 'claimed'
  `);

  const result = stmt.run(taskId);
  return result.changes > 0;
}
