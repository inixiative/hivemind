import { Database } from 'bun:sqlite';
import { existsSync } from 'fs';
import { getProjectPaths } from './getProjectPaths';
import { initializeDb } from './initializeDb';

const connections = new Map<string, Database>();

/**
 * Get database connection for a project
 *
 * Caches connections and initializes if needed
 */
export function getConnection(projectName: string): Database {
  if (connections.has(projectName)) {
    return connections.get(projectName)!;
  }

  const paths = getProjectPaths(projectName);

  let db: Database;

  if (existsSync(paths.dbPath)) {
    db = new Database(paths.dbPath);
    db.exec('PRAGMA journal_mode = WAL');
  } else {
    db = initializeDb(projectName);
  }

  connections.set(projectName, db);
  return db;
}

/**
 * Close and clear a cached connection
 *
 * Call this before deleting/resetting the database
 */
export function closeConnection(projectName: string): void {
  const conn = connections.get(projectName);
  if (conn) {
    try {
      conn.close();
    } catch {
      // Ignore close errors
    }
    connections.delete(projectName);
  }
}

/**
 * Set a connection in the cache
 *
 * Used after reset to cache the new connection
 */
export function setConnection(projectName: string, db: Database): void {
  connections.set(projectName, db);
}
