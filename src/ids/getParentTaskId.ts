import { parseId } from './parseId';

/**
 * Get parent task ID from a subtask ID
 *
 * Example: tsk_e9d2c1_001.1 → tsk_e9d2c1_001
 *          tsk_e9d2c1_001   → null (not a subtask)
 */
export function getParentTaskId(subtaskId: string): string | null {
  const parsed = parseId(subtaskId);

  if (!parsed.seq?.includes('.')) {
    return null;
  }

  const parentSeq = parsed.seq.split('.')[0];
  return `tsk_${parsed.hex}_${parentSeq}`;
}
