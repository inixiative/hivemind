import type Database from 'better-sqlite3';
import { now } from '../datetime/now';

/**
 * Update an agent's current plan and task
 */
export function updateAgentTask(
  db: Database.Database,
  agentId: string,
  planId: string | null,
  taskId: string | null
): boolean {
  const stmt = db.prepare(`
    UPDATE agents
    SET current_plan_id = ?, current_task_id = ?, last_heartbeat = ?
    WHERE id = ?
  `);

  const result = stmt.run(planId, taskId, now(), agentId);
  return result.changes > 0;
}
