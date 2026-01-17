import { getConnection } from '../../db/getConnection';
import { getActiveAgents } from '../../agents/getActiveAgents';
import { getAllWorktrees } from '../../worktrees/getAllWorktrees';
import { getRecentEvents } from '../../events/getRecentEvents';
import { getActivePlans } from '../../plans/getActivePlans';
import type { Agent } from '../../agents/types';
import type { WorktreeRecord } from '../../worktrees/types';
import type { Event, EventType } from '../../events/types';
import type { Plan } from '../../plans/types';
import type { Database } from 'bun:sqlite';

export const statusTool = {
  name: 'hivemind_status',
  description: 'CALL THIS FIRST at session start. Shows active agents, what they are working on, and recent events. Prevents duplicate work.',
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

// Event metrics types
export type DayCount = {
  date: string;
  count: number;
};

export type EventMetrics = {
  total: number;
  byDay: DayCount[];
  byType: Partial<Record<EventType, number>>;
};

// Worktree with full context
export type WorktreeWithContext = WorktreeRecord & {
  agents: Agent[];
  plans: PlanWithTasks[];
  events: EventMetrics;
};

export type StatusResult = {
  project: string;
  // Summary line for quick view
  summary: string;
  // Global metrics
  metrics: {
    activeAgents: number;
    totalWorktrees: number;
    plansWithWork: number;
    eventsThisWeek: number;
  };
  // Per-worktree breakdown (the main view)
  worktrees: WorktreeWithContext[];
  // Global activity
  activity: EventMetrics;
  // Recent events for context
  recentEvents: Event[];
  // Legacy fields for backwards compat
  activeAgents: Agent[];
  plans: PlanWithTasks[];
};

// Helper: Get events from last N days
function getEventsLastNDays(db: Database, days: number): Event[] {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  return db
    .prepare(
      `SELECT * FROM events WHERE timestamp >= ? ORDER BY seq DESC`
    )
    .all(sinceStr) as Event[];
}

// Helper: Compute event metrics from a list of events
function computeEventMetrics(events: Event[]): EventMetrics {
  const byDay: Record<string, number> = {};
  const byType: Partial<Record<EventType, number>> = {};

  for (const event of events) {
    // Group by day (YYYY-MM-DD)
    const day = event.timestamp.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;

    // Group by type
    byType[event.event_type] = (byType[event.event_type] ?? 0) + 1;
  }

  // Convert byDay to sorted array (most recent first)
  const byDayArray = Object.entries(byDay)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    total: events.length,
    byDay: byDayArray,
    byType,
  };
}

// Helper: Filter events by worktree (via worktree_id or branch)
function filterEventsByWorktree(events: Event[], worktree: WorktreeRecord): Event[] {
  return events.filter(
    (e) => e.worktree_id === worktree.id || (worktree.branch && e.branch === worktree.branch)
  );
}

export function executeStatus(input: StatusInput): StatusResult {
  const db = getConnection(input.project);

  const activeAgents = getActiveAgents(db);
  const rawWorktrees = getAllWorktrees(db);
  const recentEvents = getRecentEvents(db, 10);

  // Get events from last 7 days for metrics
  const weekEvents = getEventsLastNDays(db, 7);
  const globalActivity = computeEventMetrics(weekEvents);

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

  // Build worktree breakdown with context
  const worktrees: WorktreeWithContext[] = rawWorktrees.map((wt) => {
    // Find agents in this worktree
    const wtAgents = activeAgents.filter((a) => a.worktree_id === wt.id);

    // Find plans associated with this worktree (via branch match or explicit link)
    // For now, we match plans where any agent in this worktree is assigned
    const wtAgentIds = new Set(wtAgents.map((a) => a.id));
    const wtPlans = plans.filter((p) => {
      // Check if any agent in this worktree is working on this plan
      const planAgentIds = activeAgents
        .filter((a) => a.current_plan_id === p.id)
        .map((a) => a.id);
      return planAgentIds.some((id) => wtAgentIds.has(id));
    });

    // Compute event metrics for this worktree
    const wtEvents = filterEventsByWorktree(weekEvents, wt);
    const wtEventMetrics = computeEventMetrics(wtEvents);

    return {
      ...wt,
      agents: wtAgents,
      plans: wtPlans,
      events: wtEventMetrics,
    };
  });

  // Count plans with open work
  const plansWithWork = plans.filter((p) => p.taskCounts.pending > 0 || p.taskCounts.in_progress > 0);

  // Build summary line
  const summaryParts = [
    `hivemind:${input.project}`,
    `${activeAgents.length} agent(s)`,
    `${rawWorktrees.length} worktree(s)`,
  ];

  if (plansWithWork.length > 0) {
    summaryParts.push(`${plansWithWork.length} plan(s) active`);
  }

  summaryParts.push(`${globalActivity.total} events (7d)`);

  const summary = summaryParts.join(' | ');

  return {
    project: input.project,
    summary,
    metrics: {
      activeAgents: activeAgents.length,
      totalWorktrees: rawWorktrees.length,
      plansWithWork: plansWithWork.length,
      eventsThisWeek: globalActivity.total,
    },
    worktrees,
    activity: globalActivity,
    recentEvents,
    // Legacy fields
    activeAgents,
    plans,
  };
}
