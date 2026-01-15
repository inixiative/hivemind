import { getConnection } from '../../db/getConnection';
import { registerAgent } from '../../agents/registerAgent';
import { emit } from '../../events/emit';
import { syncWorktreesFromGit } from '../../worktrees/syncWorktreesFromGit';
import { getWorktreeByPath } from '../../worktrees/getWorktreeByPath';
import { getCurrentWorktree } from '../../git/getCurrentWorktree';
import { getBranch } from '../../git/getBranch';

export const registerTool = {
  name: 'hivemind_register',
  description: 'Register this Claude agent with the hivemind. Call this at the start of a session.',
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

  // Register the agent
  const agent = registerAgent(db, {
    label: input.label,
    sessionId: input.sessionId,
    worktreeId,
    contextSummary: input.contextSummary,
  });

  // Emit registration event
  emit(db, {
    agentId: agent.id,
    worktreeId,
    branch,
    type: 'agent:register',
    content: input.contextSummary,
    metadata: {
      sessionId: input.sessionId,
      label: input.label,
    },
  });

  return {
    agentId: agent.id,
    project: input.project,
    worktreeId,
    branch,
    message: `Agent ${agent.id} registered to hivemind:${input.project}${branch ? ` on branch ${branch}` : ''}`,
  };
}
