// Types
export type { AgentStatus, Agent, RegisterAgentInput } from './types';

// Registration
export { registerAgent } from './registerAgent';
export { unregisterAgent } from './unregisterAgent';

// Query
export { getAgent } from './getAgent';
export { getActiveAgents } from './getActiveAgents';

// Updates
export { updateAgentContext } from './updateAgentContext';
export { updateAgentTask } from './updateAgentTask';
export { updateAgentWorktree } from './updateAgentWorktree';
export { markAgentDead } from './markAgentDead';
export { markAgentIdle } from './markAgentIdle';
