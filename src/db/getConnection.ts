import Database from 'better-sqlite3';
import { existsSync } from 'fs';
import { getProjectPaths } from './getProjectPaths';
import { initializeDb } from './initializeDb';

const connections = new Map<string, Database.Database>();

/**
 * Get database connection for a project
 *
 * Caches connections and initializes if needed
 */
export function getConnection(projectName: string): Database.Database {
  if (connections.has(projectName)) {
    return connections.get(projectName)!;
  }

  const paths = getProjectPaths(projectName);

  let db: Database.Database;

  if (existsSync(paths.dbPath)) {
    db = new Database(paths.dbPath);
    db.pragma('journal_mode = WAL');
  } else {
    db = initializeDb(projectName);
  }

  connections.set(projectName, db);
  return db;
}
