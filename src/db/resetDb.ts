import { existsSync, unlinkSync } from 'fs';
import { getProjectPaths } from './getProjectPaths';
import { initializeDb } from './initializeDb';
import { closeConnection, setConnection } from './getConnection';

/**
 * Reset the database for a project
 *
 * Deletes the database files and recreates with fresh schema.
 * Use this when schema changes require a clean slate.
 */
export function resetDb(projectName: string): { deleted: string[]; created: string } {
  const paths = getProjectPaths(projectName);
  const deleted: string[] = [];

  // Close any existing connection first
  closeConnection(projectName);

  // Delete database files (main + WAL files)
  const filesToDelete = [
    paths.dbPath,
    `${paths.dbPath}-wal`,
    `${paths.dbPath}-shm`,
  ];

  for (const file of filesToDelete) {
    if (existsSync(file)) {
      unlinkSync(file);
      deleted.push(file);
    }
  }

  // Reinitialize with fresh schema
  const db = initializeDb(projectName);

  // Cache the new connection
  setConnection(projectName, db);

  return {
    deleted,
    created: paths.dbPath,
  };
}
