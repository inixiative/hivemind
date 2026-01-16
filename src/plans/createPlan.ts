import type { Database } from 'bun:sqlite';
import { makePlanId } from '../ids/makePlanId';
import { sanitizeLabel } from '../ids/sanitizeLabel';
import { now } from '../datetime/now';
import type { Plan, CreatePlanInput } from './types';

/**
 * Create a new plan
 */
export function createPlan(db: Database, input: CreatePlanInput): Plan {
  const { id, hex } = makePlanId(input.label);
  const label = input.label ? sanitizeLabel(input.label) : null;
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO plans (id, hex, label, title, description, status, branch, worktree_id, claude_session_id, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    hex,
    label,
    input.title,
    input.description ?? null,
    input.branch ?? null,
    input.worktree_id ?? null,
    input.claude_session_id ?? null,
    timestamp,
    input.created_by ?? null
  );

  return {
    id,
    hex,
    label,
    title: input.title,
    description: input.description ?? null,
    status: 'active',
    branch: input.branch ?? null,
    worktree_id: input.worktree_id ?? null,
    claude_session_id: input.claude_session_id ?? null,
    created_at: timestamp,
    created_by: input.created_by ?? null,
  };
}
