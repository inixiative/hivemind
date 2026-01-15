import type Database from 'better-sqlite3';
import type { Task } from './types';

/**
 * Get a task by ID
 */
export function getTask(db: Database.Database, taskId: string): Task | null {
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return (stmt.get(taskId) as Task) ?? null;
}
