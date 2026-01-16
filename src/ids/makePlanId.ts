import { generateHex } from './generateHex';
import { sanitizeLabel } from './sanitizeLabel';
import type { PlanId } from './typedIds';

/**
 * Create a plan ID
 *
 * Format: pln_{6hex}[_{label}]
 * Examples: pln_e9d2c1, pln_e9d2c1_auth
 */
export function makePlanId(label?: string): { id: PlanId; hex: string } {
  const hex = generateHex();

  if (label) {
    return { id: `pln_${hex}_${sanitizeLabel(label)}` as PlanId, hex };
  }

  return { id: `pln_${hex}` as PlanId, hex };
}
