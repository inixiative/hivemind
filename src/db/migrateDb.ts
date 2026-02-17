import type { Database } from 'bun:sqlite';

function hasColumn(db: Database, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((row) => row.name === column);
}

/**
 * Lightweight compatibility migrations for existing project databases.
 * Keep this idempotent and safe to run on every connection open.
 */
export function migrateDb(db: Database): void {
  if (!hasColumn(db, 'agents', 'last_seen_at')) {
    db.exec('ALTER TABLE agents ADD COLUMN last_seen_at TEXT');
  }

  db.exec('CREATE INDEX IF NOT EXISTS idx_agents_last_seen ON agents(last_seen_at)');
}
