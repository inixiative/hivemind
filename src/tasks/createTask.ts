import type Database from 'better-sqlite3';
import { makeTaskId } from '../ids/makeTaskId';
import { parseId } from '../ids/parseId';
import { getPlanHexFromTaskId } from '../ids/getPlanHexFromTaskId';
import { nextTaskSeq } from '../db/nextTaskSeq';
import type { Task, CreateTaskInput } from './types';

/**
 * Create a new task in a plan
 */
export function createTask(db: Database.Database, input: CreateTaskInput): Task {
  // Get plan hex from plan ID
  const planParsed = parseId(input.planId);
  const seq = nextTaskSeq(db, input.planId);
  const seqStr = seq.toString().padStart(3, '0');

  const id = makeTaskId(planParsed.hex, seqStr, input.label);
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
    input.planId,
    input.title,
    input.description ?? null,
    input.branch ?? null,
    input.worktreeId ?? null,
    input.parentTaskId ?? null
  );

  return {
    id,
    plan_hex: planParsed.hex,
    seq: seqStr,
    label: parsed.label ?? null,
    plan_id: input.planId,
    title: input.title,
    description: input.description ?? null,
    status: 'pending',
    branch: input.branch ?? null,
    worktree_id: input.worktreeId ?? null,
    claimed_by: null,
    claimed_at: null,
    completed_at: null,
    outcome: null,
    parent_task_id: input.parentTaskId ?? null,
  };
}
