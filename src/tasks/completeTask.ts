import type Database from 'better-sqlite3';
import { now } from '../datetime/now';
import type { Task } from './types';

/**
 * Mark a task as complete with an outcome
 */
export function completeTask(
  db: Database.Database,
  taskId: string,
  outcome?: string
): Task | null {
  const timestamp = now();

  const stmt = db.prepare(`
    UPDATE tasks
    SET status = 'done', completed_at = ?, outcome = ?
    WHERE id = ? AND status IN ('claimed', 'in_progress')
  `);

  const result = stmt.run(timestamp, outcome ?? null, taskId);

  if (result.changes === 0) {
    return null;
  }

  const getStmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return getStmt.get(taskId) as Task;
}
