import type Database from 'better-sqlite3';
import { now } from '../datetime/now';
import type { Task } from './types';

/**
 * Claim a task for an agent
 * Returns the task if successful, null if already claimed or not found
 */
export function claimTask(
  db: Database.Database,
  taskId: string,
  agentId: string
): Task | null {
  const timestamp = now();

  // Try to claim (only if pending)
  const stmt = db.prepare(`
    UPDATE tasks
    SET status = 'claimed', claimed_by = ?, claimed_at = ?
    WHERE id = ? AND status = 'pending'
  `);

  const result = stmt.run(agentId, timestamp, taskId);

  if (result.changes === 0) {
    return null; // Already claimed or not found
  }

  // Return updated task
  const getStmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return getStmt.get(taskId) as Task;
}
