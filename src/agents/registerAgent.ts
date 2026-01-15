import type Database from 'better-sqlite3';
import { makeAgentId } from '../ids/makeAgentId';
import { parseId } from '../ids/parseId';
import { now } from '../datetime/now';
import type { Agent, RegisterAgentInput } from './types';

/**
 * Register a new agent in the hivemind
 */
export function registerAgent(
  db: Database.Database,
  input: RegisterAgentInput = {}
): Agent {
  const id = makeAgentId(input.label);
  const parsed = parseId(id);
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO agents (id, hex, label, status, pid, session_id, worktree_id, context_summary, created_at, last_heartbeat)
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    parsed.hex,
    parsed.label ?? null,
    input.pid ?? null,
    input.sessionId ?? null,
    input.worktreeId ?? null,
    input.contextSummary ?? null,
    timestamp,
    timestamp
  );

  return {
    id,
    hex: parsed.hex,
    label: parsed.label ?? null,
    status: 'active',
    pid: input.pid ?? null,
    session_id: input.sessionId ?? null,
    current_plan_id: null,
    current_task_id: null,
    worktree_id: input.worktreeId ?? null,
    context_summary: input.contextSummary ?? null,
    created_at: timestamp,
    last_heartbeat: timestamp,
  };
}
