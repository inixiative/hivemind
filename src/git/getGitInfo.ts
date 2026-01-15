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
 * Get all git info for current directory
 */
export function getGitInfo(): GitInfo {
  if (!isGitRepo()) {
    return {
      isRepo: false,
      repoName: null,
      branch: null,
      root: null,
    };
  }

  return {
    isRepo: true,
    repoName: getRepoName(),
    branch: getBranch(),
    root: getRepoRoot(),
  };
}
