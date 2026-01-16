import { getConnection } from '../../db/getConnection';
import { getActiveAgents } from '../../agents/getActiveAgents';
import { getAllWorktrees } from '../../worktrees/getAllWorktrees';
import { getRecentEvents } from '../../events/getRecentEvents';
import { getActivePlans } from '../../plans/getActivePlans';
import type { Agent } from '../../agents/types';
import type { WorktreeRecord } from '../../worktrees/types';
import type { Event } from '../../events/types';
import type { Plan } from '../../plans/types';

export const statusTool = {
  name: 'hivemind_status',
  description: 'Get current hivemind status: active agents, worktrees, recent events.',
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
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

export type PlanWithTasks = Plan & {
  taskCounts: {
    pending: number;
    in_progress: number;
    done: number;
    total: number;
  };
};

export type StatusResult = {
  project: string;
  activeAgents: Agent[];
  worktrees: WorktreeRecord[];
  plans: PlanWithTasks[];
  recentEvents: Event[];
  summary: string;
};

export function executeStatus(input: StatusInput): StatusResult {
  const db = getConnection(input.project);

  const activeAgents = getActiveAgents(db);
  const worktrees = getAllWorktrees(db);
  const recentEvents = getRecentEvents(db, 10);

  // Get active plans with task counts
  const activePlans = getActivePlans(db);
  const plans: PlanWithTasks[] = activePlans.map((plan) => {
    const counts = db
      .prepare(
        `
      SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
        COUNT(*) as total
      FROM tasks
      WHERE plan_id = ?
    `
      )
      .get(plan.id) as { pending: number; in_progress: number; done: number; total: number };

    return {
      ...plan,
      taskCounts: {
        pending: counts?.pending ?? 0,
        in_progress: counts?.in_progress ?? 0,
        done: counts?.done ?? 0,
        total: counts?.total ?? 0,
      },
    };
  });

  // Count plans with open work
  const plansWithWork = plans.filter((p) => p.taskCounts.pending > 0 || p.taskCounts.in_progress > 0);

  const summary = [
    `hivemind:${input.project}`,
    `${activeAgents.length} active agent(s)`,
    `${worktrees.length} worktree(s)`,
    plansWithWork.length > 0 ? `${plansWithWork.length} plan(s) with open work` : null,
    `${recentEvents.length} recent event(s)`,
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    project: input.project,
    activeAgents,
    worktrees,
    plans,
    recentEvents,
    summary,
  };
}
