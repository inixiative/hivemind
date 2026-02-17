import { getConnection } from '../../db/getConnection';
import { getAgentBySessionId } from '../../agents/getAgentBySessionId';
import { touchAgent } from '../../agents/touchAgent';
import { getRecentEvents } from '../../events/getRecentEvents';
import { getEventsByPlan } from '../../events/getEventsByPlan';
import { getEventsByAgent } from '../../events/getEventsByAgent';
import { getEventsByBranch } from '../../events/getEventsByBranch';
import { getEventsSince } from '../../events/getEventsSince';
import type { Event } from '../../events/types';

export const queryTool = {
  name: 'hivemind_query',
  description: 'Query events from the hivemind log.',
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
      planId: {
        type: 'string',
        description: 'Filter by plan ID',
      },
      agentId: {
        type: 'string',
        description: 'Filter by agent ID',
      },
      branch: {
        type: 'string',
        description: 'Filter by branch name',
      },
      since: {
        type: 'string',
        description: 'Get events since this timestamp (yyyy/mm/dd hh:mm:ss TZ)',
      },
      limit: {
        type: 'number',
        description: 'Max events to return (default 50)',
      },
      sessionId: {
        type: 'string',
        description: 'Optional session ID to resolve agent heartbeat',
      },
    },
    required: ['project'],
  },
};

export type QueryInput = {
  project: string;
  planId?: string;
  agentId?: string;
  branch?: string;
  since?: string;
  limit?: number;
  sessionId?: string;
};

export type QueryResult = {
  events: Event[];
  count: number;
};

export function executeQuery(input: QueryInput): QueryResult {
  const db = getConnection(input.project);
  const limit = input.limit ?? 50;

  if (input.agentId) {
    touchAgent(db, input.agentId);
  } else if (input.sessionId) {
    const agent = getAgentBySessionId(db, input.sessionId);
    if (agent) {
      touchAgent(db, agent.id);
    }
  }

  let events: Event[];

  if (input.since) {
    events = getEventsSince(db, input.since, limit);
  } else if (input.planId) {
    events = getEventsByPlan(db, input.planId, limit);
  } else if (input.agentId) {
    events = getEventsByAgent(db, input.agentId, limit);
  } else if (input.branch) {
    events = getEventsByBranch(db, input.branch, limit);
  } else {
    events = getRecentEvents(db, limit);
  }

  return {
    events,
    count: events.length,
  };
}
