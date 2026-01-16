/**
 * Events MCP tool - simple event tailing
 */

import { getConnection } from '../../db/getConnection';
import { getRecentEvents } from '../../events/getRecentEvents';
import { getEventsSince } from '../../events/getEventsSince';
import type { Event } from '../../events/types';

export const eventsTool = {
  name: 'hivemind_events',
  description: 'Get recent events from the hivemind. Use to see what other agents are doing.',
  inputSchema: {
    type: 'object',
    properties: {
      project: { type: 'string', description: 'Project name' },
      limit: { type: 'number', description: 'Max events to return (default 20)' },
      since: { type: 'string', description: 'ISO timestamp - get events after this time' },
      type: { type: 'string', description: 'Filter by event type (e.g., "task:claim", "decision")' },
    },
    required: ['project'],
  },
};

export type EventsInput = {
  project: string;
  limit?: number;
  since?: string;
  type?: string;
};

export type EventsResult = {
  events: Array<{
    id: string;
    type: string;
    content: string;
    agent_id?: string;
    plan_id?: string;
    task_id?: string;
    created_at: string;
  }>;
  count: number;
  latest_timestamp?: string;
};

export function executeEvents(input: EventsInput): EventsResult {
  const db = getConnection(input.project);
  const limit = input.limit ?? 20;

  let events: Event[];

  if (input.since) {
    events = getEventsSince(db, input.since, limit);
  } else {
    events = getRecentEvents(db, limit);
  }

  // Filter by type if specified
  if (input.type) {
    events = events.filter((e) => e.event_type === input.type);
  }

  // Format for output
  const formatted = events.map((e) => ({
    id: e.id,
    type: e.event_type,
    content: e.content ?? '',
    agent_id: e.agent_id ?? undefined,
    plan_id: e.plan_id ?? undefined,
    task_id: e.task_id ?? undefined,
    created_at: e.timestamp,
  }));

  return {
    events: formatted,
    count: formatted.length,
    latest_timestamp: formatted[0]?.created_at,
  };
}
