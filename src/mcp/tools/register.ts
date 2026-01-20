import { getConnection } from '../../db/getConnection';
import { registerAgent } from '../../agents/registerAgent';
import { getAgentByPid } from '../../agents/getAgentByPid';
import { updateAgentSession } from '../../agents/updateAgentSession';
import { emit } from '../../events/emit';
import { syncWorktreesFromGit } from '../../worktrees/syncWorktreesFromGit';
import { getWorktreeByPath } from '../../worktrees/getWorktreeByPath';
import { getCurrentWorktree } from '../../git/getCurrentWorktree';
import { getBranch } from '../../git/getBranch';

export const registerTool = {
  name: 'hivemind_register',
  description: 'Register this Claude agent with the hivemind. Call this at the start of a session.',
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
        description: 'Project name (required)',
      },
      label: {
        type: 'string',
        description: 'Optional label for this agent (e.g., "alice", "backend")',
      },
      sessionId: {
        type: 'string',
        description: 'Claude session ID for --resume support',
      },
      contextSummary: {
        type: 'string',
        description: 'Brief description of what this agent knows/is working on',
      },
    },
    required: ['project'],
  },
};

export type RegisterInput = {
  project: string;
  label?: string;
  sessionId?: string;
  pid?: number;
  contextSummary?: string;
};

export type RegisterResult = {
  agentId: string;
  project: string;
  worktreeId?: string;
  branch?: string;
  message: string;
};

export function executeRegister(input: RegisterInput): RegisterResult {
  const db = getConnection(input.project);

  // Sync worktrees from git
  syncWorktreesFromGit(db);

  // Find current worktree
  const gitWorktree = getCurrentWorktree();
  let worktreeId: string | undefined;

  if (gitWorktree) {
    const dbWorktree = getWorktreeByPath(db, gitWorktree.path);
    worktreeId = dbWorktree?.id;
  }

  const branch = getBranch() ?? undefined;

  // Check if agent already exists with this PID (reconnecting after compaction)
  let agent = input.pid ? getAgentByPid(db, input.pid) : null;
  let isReconnect = false;

  if (agent && input.sessionId) {
    // Update existing agent's session ID (compaction scenario)
    updateAgentSession(db, agent.id, input.sessionId);
    isReconnect = true;
  } else {
    // Register new agent
    agent = registerAgent(db, {
      label: input.label,
      pid: input.pid,
      session_id: input.sessionId,
      worktree_id: worktreeId,
      context_summary: input.contextSummary,
    });
  }

  // Emit registration event (only for new agents)
  if (!isReconnect) {
    emit(db, {
      agent_id: agent.id,
      worktree_id: worktreeId,
      branch,
      type: 'agent:register',
      content: input.contextSummary,
      metadata: {
        sessionId: input.sessionId,
        label: input.label,
      },
    });
  }

  return {
    agentId: agent.id,
    project: input.project,
    worktreeId,
    branch,
    message: `Agent ${agent.id} registered to hivemind:${input.project}${branch ? ` on branch ${branch}` : ''}`,
  };
}
