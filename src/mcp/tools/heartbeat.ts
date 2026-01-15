import { getConnection } from '../../db/getConnection';
import { updateHeartbeat } from '../../agents/updateHeartbeat';
import { emit } from '../../events/emit';
import { getBranch } from '../../git/getBranch';

export const heartbeatTool = {
  name: 'hivemind_heartbeat',
  description: 'Send a heartbeat to indicate this agent is still alive. Call periodically.',
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
      status: {
        type: 'string',
        description: 'Optional status update',
      },
    },
    required: ['project', 'agentId'],
  },
};

export type HeartbeatInput = {
  project: string;
  agentId: string;
  status?: string;
};

export type HeartbeatResult = {
  success: boolean;
  message: string;
};

export function executeHeartbeat(input: HeartbeatInput): HeartbeatResult {
  const db = getConnection(input.project);
  const success = updateHeartbeat(db, input.agentId);

  if (success && input.status) {
    emit(db, {
      agentId: input.agentId,
      branch: getBranch() ?? undefined,
      type: 'agent:heartbeat',
      content: input.status,
    });
  }

  return {
    success,
    message: success ? 'Heartbeat recorded' : 'Agent not found',
  };
}
