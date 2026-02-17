import { getConnection } from '../../db/getConnection';
import { registerAgent } from '../../agents/registerAgent';
import { getAgentByPid } from '../../agents/getAgentByPid';
import { getAgentBySessionId } from '../../agents/getAgentBySessionId';
import { touchAgent } from '../../agents/touchAgent';
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
  cwd?: string;
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

  // Sync worktrees from git (use cwd for correct repo context)
  syncWorktreesFromGit(db, input.cwd);

  // Find current worktree (use cwd to detect correct worktree)
  const gitWorktree = getCurrentWorktree(input.cwd);
  let worktreeId: string | undefined;

  if (gitWorktree) {
    const dbWorktree = getWorktreeByPath(db, gitWorktree.path);
    worktreeId = dbWorktree?.id;
  }

  const branch = getBranch(input.cwd) ?? undefined;

  // Reconnect by session first (remote-safe), then PID fallback for local compaction.
  let agent = input.sessionId ? getAgentBySessionId(db, input.sessionId) : null;
  if (!agent && input.pid) {
    agent = getAgentByPid(db, input.pid);
  }
  let isReconnect = false;

  if (agent) {
    if (input.sessionId && agent.session_id !== input.sessionId) {
      // Update existing agent's session ID (compaction or remote reconnect scenario)
      updateAgentSession(db, agent.id, input.sessionId);
    }
    touchAgent(db, agent.id);
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
