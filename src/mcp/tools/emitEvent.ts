import { getConnection } from '../../db/getConnection';
import { getProjectPaths } from '../../db/getProjectPaths';
import { emit } from '../../events/emit';
import { getAgentBySessionId } from '../../agents/getAgentBySessionId';
import { getAgentByPid } from '../../agents/getAgentByPid';
import { ensureCoordinator } from '../../coordinator/spawn';
import { getBranch } from '../../git/getBranch';
import type { EventType } from '../../events/types';

export const emitEventTool = {
  name: 'hivemind_emit',
  description:
    'Share context with other agents. Use type=decision for architectural choices, ' +
    'type=context for discovered constraints, type=question when blocked. Keep under 80 chars.',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
  inputSchema: {
    type: 'object',
    properties: {
      project: {
        type: 'string',
        description: 'Project name',
      },
      agentId: {
        type: 'string',
        description: "This agent's ID (optional if sessionId provided)",
      },
      sessionId: {
        type: 'string',
        description: 'Claude session ID to look up agent (alternative to agentId)',
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
    required: ['project', 'type', 'content'],
  },
};

export type EmitEventInput = {
  project: string;
  agentId?: string;
  sessionId?: string;
  type: EventType;
  content: string;
  planId?: string;
  taskId?: string;
  cwd?: string;
};

export type EmitEventResult = {
  success: boolean;
  eventId?: string;
  agentId?: string;
  timestamp?: string;
  message: string;
};

export function executeEmitEvent(input: EmitEventInput): EmitEventResult {
  const db = getConnection(input.project);
  const paths = getProjectPaths(input.project);

  // Ensure coordinator is running
  ensureCoordinator({ project: input.project, dataDir: paths.projectDir });

  // Resolve agent ID - try multiple methods:
  // 1. Directly provided agentId
  // 2. Look up by sessionId
  // 3. Fallback to PID lookup (MCP server's parent is Claude)
  let agentId = input.agentId;
  if (!agentId && input.sessionId) {
    const agent = getAgentBySessionId(db, input.sessionId);
    agentId = agent?.id;
  }
  if (!agentId) {
    // Try PID fallback - process.ppid is Claude's process
    const agent = getAgentByPid(db, process.ppid);
    agentId = agent?.id;
  }

  if (!agentId) {
    return {
      success: false,
      message: 'No agent found - provide agentId or valid sessionId',
    };
  }

  const event = emit(db, {
    agent_id: agentId,
    plan_id: input.planId,
    task_id: input.taskId,
    branch: getBranch(input.cwd) ?? undefined,
    type: input.type,
    content: input.content,
  });

  return {
    success: true,
    eventId: event.id,
    agentId,
    timestamp: event.timestamp,
    message: `Event ${event.id} emitted`,
  };
}
