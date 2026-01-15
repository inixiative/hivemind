import { mkdirSync } from 'fs';
import { getProjectPaths } from './getProjectPaths';

/**
 * Ensure all project directories exist
 */
export function ensureProjectDirs(projectName: string): void {
  const paths = getProjectPaths(projectName);

  mkdirSync(paths.projectDir, { recursive: true });
  mkdirSync(paths.journalDir, { recursive: true });
  mkdirSync(paths.plansDir, { recursive: true });
  mkdirSync(paths.agentsDir, { recursive: true });
}
