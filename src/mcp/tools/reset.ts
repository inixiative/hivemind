import { existsSync } from 'fs';
import { getProjectPaths } from '../../db/getProjectPaths';
import { resetDb } from '../../db/resetDb';
import { formatDatetime } from '../../datetime/formatDatetime';
import { getGitInfo } from '../../git/getGitInfo';

export const resetTool = {
  name: 'hivemind_reset',
  description: 'Reset the hivemind database. Deletes all data and recreates with fresh schema. Use for schema migrations.',
  inputSchema: {
    type: 'object',
    properties: {
      project: {
        type: 'string',
        description: 'Project name (required)',
      },
      confirm: {
        type: 'boolean',
        description: 'Must be true to confirm reset. This is destructive!',
      },
    },
    required: ['project', 'confirm'],
  },
};

export type ResetInput = {
  project: string;
  confirm: boolean;
};

export type ResetResult = {
  success: boolean;
  message: string;
  deleted?: string[];
  created?: string;
};

/**
 * Execute reset - deletes database and recreates with fresh schema
 */
export function executeReset(input: ResetInput): ResetResult {
  // Safety check
  if (!input.confirm) {
    return {
      success: false,
      message: 'Reset not confirmed. Set confirm: true to proceed. WARNING: This deletes all data!',
    };
  }

  const paths = getProjectPaths(input.project);

  // Check if database exists
  if (!existsSync(paths.dbPath)) {
    return {
      success: false,
      message: `No database found for project "${input.project}" at ${paths.dbPath}`,
    };
  }

  // Perform reset
  const result = resetDb(input.project);

  return {
    success: true,
    message: `hivemind reset: ${input.project}\ndeleted: ${result.deleted.length} files\ncreated: ${result.created}\ntimestamp: ${formatDatetime()}`,
    deleted: result.deleted,
    created: result.created,
  };
}
