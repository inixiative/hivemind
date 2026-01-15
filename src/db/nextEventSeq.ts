import type Database from 'better-sqlite3';

/**
 * Get next event sequence number (atomic increment)
 */
export function nextEventSeq(db: Database.Database): number {
  const stmt = db.prepare(`
    UPDATE sequences
    SET value = value + 1
    WHERE name = 'events'
    RETURNING value
  `);

  const result = stmt.get() as { value: number };
  return result.value;
}
