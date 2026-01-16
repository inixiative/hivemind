import type { Database } from 'bun:sqlite';
import type { Task } from './types';

/**
 * Get a task by ID
 */
export function getTask(db: Database, taskId: string): Task | null {
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return (stmt.get(taskId) as Task) ?? null;
}
