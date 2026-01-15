import { getConnection } from '../../db/getConnection';
import { emit } from '../../events/emit';
import { getBranch } from '../../git/getBranch';
import type { EventType } from '../../events/types';

export const emitEventTool = {
  name: 'hivemind_emit',
  description: 'Emit an event to the hivemind log for other agents to see.',
  inputSchema: {
    type: 'object',
    properties: {
      project: {
        type: 'string',
        description: 'Project name',
      },
      agentId: {
        type: 'string',
        description: 'This agent\'s ID',
      },
      type: {
        type: 'string',
        description: 'Event type (decision, question, answer, context, note, etc.)',
      },
      content: {
        type: 'string',
        description: 'Event content/message',
      },
      planId: {
        type: 'string',
        description: 'Optional plan ID this event relates to',
      },
      taskId: {
        type: 'string',
        description: 'Optional task ID this event relates to',
      },
    },
    required: ['project', 'agentId', 'type', 'content'],
  },
};

export type EmitEventInput = {
  project: string;
  agentId: string;
  type: EventType;
  content: string;
  planId?: string;
  taskId?: string;
};

export type EmitEventResult = {
  eventId: string;
  timestamp: string;
  message: string;
};

export function executeEmitEvent(input: EmitEventInput): EmitEventResult {
  const db = getConnection(input.project);

  const event = emit(db, {
    agentId: input.agentId,
    planId: input.planId,
    taskId: input.taskId,
    branch: getBranch() ?? undefined,
    type: input.type,
    content: input.content,
  });

  return {
    eventId: event.id,
    timestamp: event.timestamp,
    message: `Event ${event.id} emitted`,
  };
}
