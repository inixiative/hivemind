import { getConnection } from '../../db/getConnection';
import { getActiveAgents } from '../../agents/getActiveAgents';
import { getStaleAgents } from '../../agents/getStaleAgents';
import { getAllWorktrees } from '../../worktrees/getAllWorktrees';
import { getRecentEvents } from '../../events/getRecentEvents';
import type { Agent } from '../../agents/types';
import type { WorktreeRecord } from '../../worktrees/types';
import type { Event } from '../../events/types';

export const statusTool = {
  name: 'hivemind_status',
  description: 'Get current hivemind status: active agents, worktrees, recent events.',
  inputSchema: {
    type: 'object',
    properties: {
      project: {
        type: 'string',
        description: 'Project name',
      },
    },
    required: ['project'],
  },
};

export type StatusInput = {
  project: string;
};

export type StatusResult = {
  project: string;
  activeAgents: Agent[];
  staleAgents: Agent[];
  worktrees: WorktreeRecord[];
  recentEvents: Event[];
  summary: string;
};

export function executeStatus(input: StatusInput): StatusResult {
  const db = getConnection(input.project);

  const activeAgents = getActiveAgents(db);
  const staleAgents = getStaleAgents(db);
  const worktrees = getAllWorktrees(db);
  const recentEvents = getRecentEvents(db, 10);

  const summary = [
    `hivemind:${input.project}`,
    `${activeAgents.length} active agent(s)`,
    staleAgents.length > 0 ? `${staleAgents.length} stale agent(s)` : null,
    `${worktrees.length} worktree(s)`,
    `${recentEvents.length} recent event(s)`,
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    project: input.project,
    activeAgents,
    staleAgents,
    worktrees,
    recentEvents,
    summary,
  };
}
