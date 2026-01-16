/**
 * Task status values
 */
export type TaskStatus = 'pending' | 'claimed' | 'in_progress' | 'blocked' | 'done';

/**
 * Task record as stored in DB
 */
export type Task = {
  id: string;
  plan_hex: string;
  seq: string;
  label: string | null;
  plan_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  branch: string | null;
  worktree_id: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  outcome: string | null;
  parent_task_id: string | null;
};

/**
 * Input for creating a task
 */
export type CreateTaskInput = {
  plan_id: string;
  title: string;
  description?: string;
  branch?: string;
  worktree_id?: string;
  parent_task_id?: string;
  label?: string;
};
