import { parseId } from './parseId';

/**
 * Extract plan hex from a task ID
 *
 * Example: tsk_e9d2c1_001 → 'e9d2c1'
 */
export function getPlanHexFromTaskId(taskId: string): string {
  return parseId(taskId).hex;
}
