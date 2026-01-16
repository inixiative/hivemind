import type { Database } from 'bun:sqlite';
import { emit } from '../../events/emit';
import type { Event, EventType } from '../../events/types';
import type { Agent } from '../../agents/types';
import type { Plan } from '../../plans/types';
import type { Task } from '../../tasks/types';
import { buildAgent } from './agentFactory';

export type EventOverrides = {
  type?: EventType;
  content?: string;
  agent?: Agent;
  plan?: Plan;
  task?: Task;
  branch?: string;
  worktree_id?: string;
  metadata?: Record<string, unknown>;
};

export type BuildEventResult = {
  event: Event;
  agent: Agent;
};

export function buildEvent(db: Database, overrides: EventOverrides = {}): BuildEventResult {
  const agent = overrides.agent ?? buildAgent(db).agent;

  const event = emit(db, {
    agent_id: agent.id,
    type: overrides.type ?? 'note',
    content: overrides.content ?? 'Test event',
    plan_id: overrides.plan?.id,
    task_id: overrides.task?.id,
    worktree_id: overrides.worktree_id,
    branch: overrides.branch,
    metadata: overrides.metadata,
  });

  return { event, agent };
}
