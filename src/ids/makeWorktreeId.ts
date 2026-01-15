import { generateHex } from './generateHex';
import { sanitizeLabel } from './sanitizeLabel';

/**
 * Create a worktree ID: wkt_{hex}[_{label}]
 */
export function makeWorktreeId(label?: string): string {
  const hex = generateHex();
  if (label) {
    return `wkt_${hex}_${sanitizeLabel(label)}`;
  }
  return `wkt_${hex}`;
}
