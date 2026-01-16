import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, rmSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DB_DIR = join(__dirname, '../../.test-db');

let testDbCounter = 0;

export type TestDb = {
  db: Database;
  path: string;
  cleanup: () => void;
  clearAllTables: () => void;
};

export function createTestDb(): TestDb {
  testDbCounter++;
  const dbPath = join(TEST_DB_DIR, `test-${Date.now()}-${testDbCounter}.sqlite`);

  if (!existsSync(TEST_DB_DIR)) {
    mkdirSync(TEST_DB_DIR, { recursive: true });
  }

  const db = new Database(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA foreign_keys = ON');

  const schemaPath = join(__dirname, '../db/schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  const clearAllTables = () => {
    // Order matters due to FK constraints - delete children first
    db.exec('DELETE FROM events');
    db.exec('DELETE FROM tasks');
    db.exec('DELETE FROM plans');
    db.exec('DELETE FROM agents');
    db.exec('DELETE FROM worktrees');
    // Reset sequence counter
    db.exec("UPDATE sequences SET value = 0 WHERE name = 'events'");
  };

  const cleanup = () => {
    db.close();
    if (existsSync(dbPath)) {
      rmSync(dbPath, { force: true });
    }
    if (existsSync(`${dbPath}-wal`)) {
      rmSync(`${dbPath}-wal`, { force: true });
    }
    if (existsSync(`${dbPath}-shm`)) {
      rmSync(`${dbPath}-shm`, { force: true });
    }
  };

  return { db, path: dbPath, cleanup, clearAllTables };
}

export function cleanupAllTestDbs(): void {
  if (existsSync(TEST_DB_DIR)) {
    rmSync(TEST_DB_DIR, { recursive: true, force: true });
  }
}
