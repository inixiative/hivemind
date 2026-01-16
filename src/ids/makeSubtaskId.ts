import { sanitizeLabel } from './sanitizeLabel';
import type { TaskId } from './typedIds';

/**
 * Create a subtask ID from a parent task ID
 *
 * Format: tsk_{planHex}_{parentSeq}.{subSeq}[_{label}]
 * Example: tsk_e9d2c1_001 + subSeq 1 → tsk_e9d2c1_001.1
 */
export function makeSubtaskId(parentTaskId: TaskId, subSeq: number, label?: string): TaskId {
  const parts = parentTaskId.split('_');
  const base = parts.slice(0, 3).join('_'); // tsk_e9d2c1_001

  if (label) {
    return `${base}.${subSeq}_${sanitizeLabel(label)}` as TaskId;
  }

  return `${base}.${subSeq}` as TaskId;
}
