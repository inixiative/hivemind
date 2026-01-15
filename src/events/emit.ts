import type Database from 'better-sqlite3';
import { makeEventId } from '../ids/makeEventId';
import { parseId } from '../ids/parseId';
import { now } from '../datetime/now';
import { nextEventSeq } from '../db/nextEventSeq';
import type { EventInput, Event } from './types';

/**
 * Emit an event to the hivemind log
 */
export function emit(db: Database.Database, input: EventInput): Event {
  const seq = nextEventSeq(db);
  const id = makeEventId(seq);
  const parsed = parseId(id);
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO events (id, hex, seq, timestamp, agent_id, plan_id, task_id, worktree_id, branch, event_type, content, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    parsed.hex,
    seq,
    timestamp,
    input.agentId,
    input.planId ?? null,
    input.taskId ?? null,
    input.worktreeId ?? null,
    input.branch ?? null,
    input.type,
    input.content ?? null,
    input.metadata ? JSON.stringify(input.metadata) : null
  );

  return {
    id,
    hex: parsed.hex,
    seq,
    timestamp,
    agent_id: input.agentId,
    plan_id: input.planId ?? null,
    task_id: input.taskId ?? null,
    worktree_id: input.worktreeId ?? null,
    branch: input.branch ?? null,
    event_type: input.type,
    content: input.content ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  };
}
