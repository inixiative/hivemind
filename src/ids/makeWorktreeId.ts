import { generateHex } from './generateHex';
import { sanitizeLabel } from './sanitizeLabel';
import type { WorktreeId } from './typedIds';

/**
 * Create a worktree ID: wkt_{hex}[_{label}]
 */
export function makeWorktreeId(label?: string): WorktreeId {
  const hex = generateHex();
  if (label) {
    return `wkt_${hex}_${sanitizeLabel(label)}` as WorktreeId;
  }
  return `wkt_${hex}` as WorktreeId;
}
