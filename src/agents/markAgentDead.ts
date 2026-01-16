import type { Database } from 'bun:sqlite';

/**
 * Mark an agent as dead (no longer responding)
 * Also releases any tasks the agent had claimed back to pending
 */
export function markAgentDead(db: Database, agentId: string): boolean {
  // Release any tasks this agent had claimed or was working on
  const releaseTasksStmt = db.prepare(`
    UPDATE tasks
    SET status = 'pending',
        claimed_by = NULL,
        claimed_at = NULL
    WHERE claimed_by = ?
      AND status IN ('claimed', 'in_progress')
  `);
  releaseTasksStmt.run(agentId);

  // Mark the agent as dead and clear its current task/plan references
  const stmt = db.prepare(`
    UPDATE agents
    SET status = 'dead',
        current_task_id = NULL,
        current_plan_id = NULL
    WHERE id = ?
  `);

  const result = stmt.run(agentId);
  return result.changes > 0;
}
