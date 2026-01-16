import type { Database } from 'bun:sqlite';
import { makeEventId } from '../ids/makeEventId';
import { now } from '../datetime/now';
import { nextEventSeq } from '../db/nextEventSeq';
import type { EventInput, Event } from './types';

/**
 * Emit an event to the hivemind log
 */
export function emit(db: Database, input: EventInput): Event {
  const seq = nextEventSeq(db);
  const { id, hex } = makeEventId(seq);
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO events (id, hex, seq, timestamp, agent_id, plan_id, task_id, worktree_id, branch, event_type, content, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const agentId = input.agent_id ?? 'system';

  stmt.run(
    id,
    hex,
    seq,
    timestamp,
    agentId,
    input.plan_id ?? null,
    input.task_id ?? null,
    input.worktree_id ?? null,
    input.branch ?? null,
    input.type,
    input.content ?? null,
    input.metadata ? JSON.stringify(input.metadata) : null
  );

  return {
    id,
    hex,
    seq,
    timestamp,
    agent_id: agentId,
    plan_id: input.plan_id ?? null,
    task_id: input.task_id ?? null,
    worktree_id: input.worktree_id ?? null,
    branch: input.branch ?? null,
    event_type: input.type,
    content: input.content ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  };
}
