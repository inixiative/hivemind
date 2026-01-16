/**
 * Agent status values
 */
export type AgentStatus = 'active' | 'idle' | 'dead';

/**
 * Agent record as stored in DB
 */
export type Agent = {
  id: string;
  hex: string;
  label: string | null;
  status: AgentStatus;
  pid: number | null;
  session_id: string | null;
  current_plan_id: string | null;
  current_task_id: string | null;
  worktree_id: string | null;
  context_summary: string | null;
  created_at: string;
};

/**
 * Input for registering an agent
 */
export type RegisterAgentInput = {
  label?: string;
  pid?: number;
  session_id?: string;
  worktree_id?: string;
  context_summary?: string;
};
