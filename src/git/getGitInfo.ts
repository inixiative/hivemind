import { isGitRepo } from './isGitRepo';
import { getRepoName } from './getRepoName';
import { getBranch } from './getBranch';
import { getRepoRoot } from './getRepoRoot';

export type GitInfo = {
  isRepo: boolean;
  repoName: string | null;
  branch: string | null;
  root: string | null;
};

/**
 * Get all git info for a directory (defaults to process.cwd())
 */
export function getGitInfo(cwd?: string): GitInfo {
  if (!isGitRepo(cwd)) {
    return {
      isRepo: false,
      repoName: null,
      branch: null,
      root: null,
    };
  }

  return {
    isRepo: true,
    repoName: getRepoName(cwd),
    branch: getBranch(cwd),
    root: getRepoRoot(cwd),
  };
}
