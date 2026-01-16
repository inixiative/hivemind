import type { Database } from 'bun:sqlite';
import { makeAgentId } from '../ids/makeAgentId';
import { parseId } from '../ids/parseId';
import { now } from '../datetime/now';
import type { Agent, RegisterAgentInput } from './types';

/**
 * Register a new agent in the hivemind
 */
export function registerAgent(
  db: Database,
  input: RegisterAgentInput = {}
): Agent {
  const id = makeAgentId(input.label);
  const parsed = parseId(id);
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO agents (id, hex, label, status, pid, session_id, worktree_id, context_summary, created_at)
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    parsed.hex,
    parsed.label ?? null,
    input.pid ?? null,
    input.session_id ?? null,
    input.worktree_id ?? null,
    input.context_summary ?? null,
    timestamp
  );

  return {
    id,
    hex: parsed.hex,
    label: parsed.label ?? null,
    status: 'active',
    pid: input.pid ?? null,
    session_id: input.session_id ?? null,
    current_plan_id: null,
    current_task_id: null,
    worktree_id: input.worktree_id ?? null,
    context_summary: input.context_summary ?? null,
    created_at: timestamp,
  };
}
