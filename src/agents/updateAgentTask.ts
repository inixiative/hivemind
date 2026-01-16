import type { Database } from 'bun:sqlite';

/**
 * Update an agent's current plan and task
 */
export function updateAgentTask(
  db: Database,
  agentId: string,
  planId: string | null,
  taskId: string | null
): boolean {
  const stmt = db.prepare(`
    UPDATE agents
    SET current_plan_id = ?, current_task_id = ?
    WHERE id = ?
  `);

  const result = stmt.run(planId, taskId, agentId);
  return result.changes > 0;
}
