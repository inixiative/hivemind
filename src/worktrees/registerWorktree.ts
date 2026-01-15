import type Database from 'better-sqlite3';
import { makeWorktreeId } from '../ids/makeWorktreeId';
import { parseId } from '../ids/parseId';
import { now } from '../datetime/now';
import type { WorktreeRecord, RegisterWorktreeInput } from './types';

/**
 * Register a worktree in the hivemind
 */
export function registerWorktree(
  db: Database.Database,
  input: RegisterWorktreeInput
): WorktreeRecord {
  const id = makeWorktreeId(input.label);
  const parsed = parseId(id);
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO worktrees (id, hex, label, path, branch, commit, is_main, status, created_at, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
  `);

  stmt.run(
    id,
    parsed.hex,
    parsed.label ?? null,
    input.path,
    input.branch ?? null,
    input.commit ?? null,
    input.isMain ? 1 : 0,
    timestamp,
    timestamp
  );

  return {
    id,
    hex: parsed.hex,
    label: parsed.label ?? null,
    path: input.path,
    branch: input.branch ?? null,
    commit: input.commit ?? null,
    is_main: input.isMain ? 1 : 0,
    status: 'active',
    created_at: timestamp,
    last_seen: timestamp,
  };
}
