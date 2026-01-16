import { existsSync } from 'fs';
import { HIVEMIND_BASE } from '../../db/constants';
import { getProjectPaths } from '../../db/getProjectPaths';
import { initializeDb } from '../../db/initializeDb';
import { formatDatetime } from '../../datetime/formatDatetime';
import { getGitInfo } from '../../git/getGitInfo';

export const setupTool = {
  name: 'hivemind_setup',
  description: 'Initialize hivemind for a project. Detects git repo info automatically.',
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  inputSchema: {
    type: 'object',
    properties: {
      project: {
        type: 'string',
        description: 'Project name. If omitted, will use git repo name or prompt.',
      },
      useGit: {
        type: 'boolean',
        description: 'Use git repo info for project name (default: true if in git repo)',
      },
    },
  },
};

export type SetupInput = {
  project?: string;
  useGit?: boolean;
};

export type SetupResult = {
  needsInput: boolean;
  gitInfo?: {
    repoName: string | null;
    branch: string | null;
    root: string | null;
  };
  message?: string;
  project?: string;
  dbPath?: string;
};

/**
 * Execute setup - may return prompt for user input
 */
export function executeSetup(input: SetupInput): SetupResult {
  const gitInfo = getGitInfo();

  // If no project specified and we're in a git repo, ask to use it
  if (!input.project && gitInfo.isRepo && input.useGit === undefined) {
    return {
      needsInput: true,
      gitInfo: {
        repoName: gitInfo.repoName,
        branch: gitInfo.branch,
        root: gitInfo.root,
      },
      message: `Git repository detected: ${gitInfo.repoName}\nUse this for project name? (set useGit: true/false)`,
    };
  }

  // Determine project name
  let projectName: string;

  if (input.project) {
    projectName = input.project;
  } else if (input.useGit !== false && gitInfo.isRepo && gitInfo.repoName) {
    projectName = gitInfo.repoName;
  } else {
    projectName = process.cwd().split('/').pop() || 'default';
  }

  // Initialize
  const paths = getProjectPaths(projectName);
  const isNew = !existsSync(paths.dbPath);
  const db = initializeDb(projectName);

  let stats = '';
  if (!isNew) {
    const agentCount = (db.prepare('SELECT COUNT(*) as c FROM agents').get() as { c: number }).c;
    const planCount = (db.prepare('SELECT COUNT(*) as c FROM plans').get() as { c: number }).c;
    const eventCount = (db.prepare('SELECT COUNT(*) as c FROM events').get() as { c: number }).c;
    stats = `\nstats: ${agentCount} agents, ${planCount} plans, ${eventCount} events`;
  }

  db.close();

  return {
    needsInput: false,
    project: projectName,
    dbPath: paths.dbPath,
    message: `hivemind ${isNew ? 'created' : 'connected'}: ${projectName}\ndb: ${paths.dbPath}${stats}\ntimestamp: ${formatDatetime()}`,
  };
}
