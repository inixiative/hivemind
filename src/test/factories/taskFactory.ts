import type { Database } from 'bun:sqlite';
import { createTask } from '../../tasks/createTask';
import type { Task, TaskStatus } from '../../tasks/types';
import type { Plan } from '../../plans/types';
import type { Agent } from '../../agents/types';
import { buildPlan } from './planFactory';

export type TaskOverrides = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  claimed_by?: Agent;
  plan?: Plan;
  agent?: Agent;
  branch?: string;
  worktree_id?: string;
  parent_task_id?: string;
  label?: string;
};

export type BuildTaskResult = {
  task: Task;
  plan: Plan;
  agent: Agent;
};

export function buildTask(db: Database, overrides: TaskOverrides = {}): BuildTaskResult {
  let plan: Plan;
  let agent: Agent;

  if (overrides.plan) {
    plan = overrides.plan;
    const agentRow = db.prepare(`SELECT * FROM agents WHERE id = ?`).get(plan.created_by) as Agent | null;
    agent = overrides.agent ?? agentRow ?? buildPlan(db).agent;
  } else {
    const result = buildPlan(db, { agent: overrides.agent });
    plan = result.plan;
    agent = result.agent;
  }

  const task = createTask(db, {
    plan_id: plan.id,
    title: overrides.title ?? 'Test Task',
    description: overrides.description,
    branch: overrides.branch,
    worktree_id: overrides.worktree_id,
    parent_task_id: overrides.parent_task_id,
    label: overrides.label,
  });

  // Handle status and claimed_by if provided
  if (overrides.status || overrides.claimed_by) {
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (overrides.status) {
      updates.push('status = ?');
      values.push(overrides.status);
    }

    if (overrides.claimed_by) {
      updates.push('claimed_by = ?', 'claimed_at = ?');
      values.push(overrides.claimed_by.id, new Date().toISOString());
    }

    if (updates.length > 0) {
      values.push(task.id);
      db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
  }

  const finalTask = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(task.id) as Task;

  return { task: finalTask, plan, agent };
}
