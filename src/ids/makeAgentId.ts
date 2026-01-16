import { generateHex } from './generateHex';
import { sanitizeLabel } from './sanitizeLabel';
import type { AgentId } from './typedIds';

/**
 * Create an agent ID
 *
 * Format: agt_{6hex}[_{label}]
 * Examples: agt_7a3f2b, agt_7a3f2b_alice
 */
export function makeAgentId(label?: string): AgentId {
  const hex = generateHex();

  if (label) {
    return `agt_${hex}_${sanitizeLabel(label)}` as AgentId;
  }

  return `agt_${hex}` as AgentId;
}
