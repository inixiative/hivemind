import type { Database } from 'bun:sqlite';
import { makeTaskId } from '../ids/makeTaskId';
import { parseId } from '../ids/parseId';
import { getPlanHexFromTaskId } from '../ids/getPlanHexFromTaskId';
import { nextTaskSeq } from '../db/nextTaskSeq';
import type { Task, CreateTaskInput } from './types';

/**
 * Create a new task in a plan
 */
export function createTask(db: Database, input: CreateTaskInput): Task {
  // Get plan hex from plan ID
  const planParsed = parseId(input.plan_id);
  const seq = nextTaskSeq(db, input.plan_id);
  const seqStr = String(seq).padStart(3, '0');

  const id = makeTaskId(planParsed.hex, seq, input.label);
  const parsed = parseId(id);

  const stmt = db.prepare(`
    INSERT INTO tasks (id, plan_hex, seq, label, plan_id, title, description, status, branch, worktree_id, parent_task_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `);

  stmt.run(
    id,
    planParsed.hex,
    seqStr,
    parsed.label ?? null,
    input.plan_id,
    input.title,
    input.description ?? null,
    input.branch ?? null,
    input.worktree_id ?? null,
    input.parent_task_id ?? null
  );

  return {
    id,
    plan_hex: planParsed.hex,
    seq: seqStr,
    label: parsed.label ?? null,
    plan_id: input.plan_id,
    title: input.title,
    description: input.description ?? null,
    status: 'pending',
    branch: input.branch ?? null,
    worktree_id: input.worktree_id ?? null,
    claimed_by: null,
    claimed_at: null,
    completed_at: null,
    outcome: null,
    parent_task_id: input.parent_task_id ?? null,
  };
}
