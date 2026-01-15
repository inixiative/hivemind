import { sanitizeLabel } from './sanitizeLabel';

/**
 * Create a task ID (inherits plan's hex)
 *
 * Format: tsk_{planHex}_{seq}[_{label}]
 * Examples: tsk_e9d2c1_001, tsk_e9d2c1_002_jwt
 */
export function makeTaskId(planHex: string, seq: number, label?: string): string {
  const seqStr = String(seq).padStart(3, '0');

  if (label) {
    return `tsk_${planHex}_${seqStr}_${sanitizeLabel(label)}`;
  }

  return `tsk_${planHex}_${seqStr}`;
}
