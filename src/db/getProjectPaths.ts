import { join } from 'path';
import { HIVEMIND_BASE } from './constants';

export type ProjectPaths = {
  projectDir: string;
  dbPath: string;
  streamPath: string;
  journalDir: string;
  plansDir: string;
  agentsDir: string;
};

/**
 * Get project-specific paths
 *
 * Structure:
 *   ~/.hivemind/
 *     └── claude_hivemind_<project>/
 *         ├── hivemind.db
 *         ├── stream.jsonl
 *         ├── journal/
 *         ├── plans/
 *         └── agents/
 */
export function getProjectPaths(projectName: string): ProjectPaths {
  const sanitized = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const projectDir = join(HIVEMIND_BASE, `claude_hivemind_${sanitized}`);

  return {
    projectDir,
    dbPath: join(projectDir, 'hivemind.db'),
    streamPath: join(projectDir, 'stream.jsonl'),
    journalDir: join(projectDir, 'journal'),
    plansDir: join(projectDir, 'plans'),
    agentsDir: join(projectDir, 'agents'),
  };
}
