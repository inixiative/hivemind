import type Database from 'better-sqlite3';
import { makePlanId } from '../ids/makePlanId';
import { parseId } from '../ids/parseId';
import { now } from '../datetime/now';
import type { Plan, CreatePlanInput } from './types';

/**
 * Create a new plan
 */
export function createPlan(db: Database.Database, input: CreatePlanInput): Plan {
  const id = makePlanId(input.label);
  const parsed = parseId(id);
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO plans (id, hex, label, title, description, status, branch, worktree_id, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    parsed.hex,
    parsed.label ?? null,
    input.title,
    input.description ?? null,
    input.branch ?? null,
    input.worktreeId ?? null,
    timestamp,
    input.createdBy ?? null
  );

  return {
    id,
    hex: parsed.hex,
    label: parsed.label ?? null,
    title: input.title,
    description: input.description ?? null,
    status: 'active',
    branch: input.branch ?? null,
    worktree_id: input.worktreeId ?? null,
    created_at: timestamp,
    created_by: input.createdBy ?? null,
  };
}
