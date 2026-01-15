import { generateHex } from './generateHex';
import { sanitizeLabel } from './sanitizeLabel';

/**
 * Create a plan ID
 *
 * Format: pln_{6hex}[_{label}]
 * Examples: pln_e9d2c1, pln_e9d2c1_auth
 */
export function makePlanId(label?: string): string {
  const hex = generateHex();

  if (label) {
    return `pln_${hex}_${sanitizeLabel(label)}`;
  }

  return `pln_${hex}`;
}
