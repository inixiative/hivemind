import { parseId } from './parseId';

/**
 * Check if a task ID is a subtask (contains a dot in seq)
 *
 * Example: tsk_e9d2c1_001.1 → true
 *          tsk_e9d2c1_001   → false
 */
export function isSubtask(taskId: string): boolean {
  const parsed = parseId(taskId);
  return parsed.seq?.includes('.') ?? false;
}
