import type { Database } from 'bun:sqlite';
import { now } from '../datetime/now';
import type { Task } from './types';

/**
 * Assign a task to an agent (force claim, even if already claimed)
 * Use this when coordinating work - e.g., spawning a new agent for a task
 */
export function assignTask(
  db: Database,
  taskId: string,
  agentId: string
): Task | null {
  const timestamp = now();

  const stmt = db.prepare(`
    UPDATE tasks
    SET status = 'claimed', claimed_by = ?, claimed_at = ?
    WHERE id = ?
  `);

  const result = stmt.run(agentId, timestamp, taskId);

  if (result.changes === 0) {
    return null; // Task not found
  }

  // Return updated task
  const getStmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return getStmt.get(taskId) as Task;
}
