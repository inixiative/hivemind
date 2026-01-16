/**
 * Event types in the hivemind system
 */
export type EventType =
  | 'agent:register'
  | 'agent:unregister'
  | 'agent:dead'
  | 'worktree:register'
  | 'worktree:switch'
  | 'worktree:stale'
  | 'plan:create'
  | 'plan:sync'
  | 'plan:join'
  | 'plan:leave'
  | 'plan:complete'
  | 'task:create'
  | 'task:claim'
  | 'task:unclaim'
  | 'task:start'
  | 'task:block'
  | 'task:unblock'
  | 'task:complete'
  | 'decision'
  | 'question'
  | 'answer'
  | 'context'
  | 'note';

/**
 * Event record as stored in DB
 */
export type Event = {
  id: string;
  hex: string;
  seq: number;
  timestamp: string;
  agent_id: string;
  plan_id: string | null;
  task_id: string | null;
  worktree_id: string | null;
  branch: string | null;
  event_type: EventType;
  content: string | null;
  metadata: string | null;
};

/**
 * Input for creating an event
 */
export type EventInput = {
  agent_id?: string; // Optional - defaults to 'system' for automated events
  plan_id?: string;
  task_id?: string;
  worktree_id?: string;
  branch?: string;
  type: EventType;
  content?: string;
  metadata?: Record<string, unknown>;
};
