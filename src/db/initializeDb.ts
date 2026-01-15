import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getProjectPaths } from './getProjectPaths';
import { ensureProjectDirs } from './ensureProjectDirs';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Initialize the database for a project
 *
 * Creates directories and runs schema
 */
export function initializeDb(projectName: string): Database.Database {
  ensureProjectDirs(projectName);

  const paths = getProjectPaths(projectName);
  const db = new Database(paths.dbPath);

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');

  // Run schema
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);

  return db;
}
