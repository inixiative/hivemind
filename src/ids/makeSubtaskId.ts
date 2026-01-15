import { sanitizeLabel } from './sanitizeLabel';

/**
 * Create a subtask ID from a parent task ID
 *
 * Format: tsk_{planHex}_{parentSeq}.{subSeq}[_{label}]
 * Example: tsk_e9d2c1_001 + subSeq 1 → tsk_e9d2c1_001.1
 */
export function makeSubtaskId(parentTaskId: string, subSeq: number, label?: string): string {
  const parts = parentTaskId.split('_');
  const base = parts.slice(0, 3).join('_'); // tsk_e9d2c1_001

  if (label) {
    return `${base}.${subSeq}_${sanitizeLabel(label)}`;
  }

  return `${base}.${subSeq}`;
}
