/**
 * Plan status values
 */
export type PlanStatus = 'active' | 'paused' | 'complete';

/**
 * Plan record as stored in DB
 */
export type Plan = {
  id: string;
  hex: string;
  label: string | null;
  title: string;
  description: string | null;
  status: PlanStatus;
  branch: string | null;
  worktree_id: string | null;
  claude_session_id: string | null;
  created_at: string;
  created_by: string | null;
};

/**
 * Input for creating a plan
 */
export type CreatePlanInput = {
  title: string;
  description?: string;
  branch?: string;
  worktree_id?: string;
  claude_session_id?: string;
  created_by?: string;
  label?: string;
};
