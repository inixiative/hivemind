import type { Database } from 'bun:sqlite';
import { registerAgent } from '../../agents/registerAgent';
import type { Agent } from '../../agents/types';

export type AgentOverrides = {
  label?: string;
  context_summary?: string;
  pid?: number;
  session_id?: string;
  worktree_id?: string;
};

export type BuildAgentResult = {
  agent: Agent;
};

export function buildAgent(db: Database, overrides: AgentOverrides = {}): BuildAgentResult {
  const agent = registerAgent(db, overrides);
  return { agent };
}
