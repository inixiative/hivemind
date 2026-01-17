import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { rmSync, existsSync } from 'fs';
import { setConnection, closeConnection } from '../db/getConnection';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Single shared in-memory database for all tests
let sharedDb: Database | null = null;
let testDbCounter = 0;

export type TestDb = {
  db: Database;
  project: string;
  cleanup: () => void;
  clearAllTables: () => void;
};

function getOrCreateSharedDb(): Database {
  if (!sharedDb) {
    sharedDb = new Database(':memory:');
    sharedDb.exec('PRAGMA foreign_keys = ON');

    const schemaPath = join(__dirname, '../db/schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    sharedDb.exec(schema);
  }
  return sharedDb;
}

export function createTestDb(): TestDb {
  testDbCounter++;
  const project = `test-project-${Date.now()}-${testDbCounter}`;
  const db = getOrCreateSharedDb();

  // Register with connection cache so getConnection(project) works
  setConnection(project, db);

  const clearAllTables = () => {
    // Disable FK checks for cleanup (circular refs between agents/plans/tasks)
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DELETE FROM events');
    db.exec('DELETE FROM tasks');
    db.exec('DELETE FROM plans');
    db.exec('DELETE FROM agents');
    db.exec('DELETE FROM worktrees');
    db.exec("UPDATE sequences SET value = 0 WHERE name = 'events'");
    db.exec('PRAGMA foreign_keys = ON');
  };

  const cleanup = () => {
    // Clear tables for next test
    clearAllTables();
    // Remove this project from connection cache (but don't close the shared db)
    // We need a way to just remove from cache without closing
    // For now, we'll just clear tables - the project name is unique anyway
  };

  return { db, project, cleanup, clearAllTables };
}

export function cleanupAllTestDbs(): void {
  if (sharedDb) {
    sharedDb.close();
    sharedDb = null;
  }
  testDbCounter = 0;
}
