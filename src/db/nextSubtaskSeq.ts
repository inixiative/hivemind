import type Database from 'better-sqlite3';

/**
 * Get next subtask sequence number for a parent task
 */
export function nextSubtaskSeq(db: Database.Database, parentTaskId: string): number {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM tasks
    WHERE parent_task_id = ?
  `);

  const result = stmt.get(parentTaskId) as { count: number };
  return result.count + 1;
}
