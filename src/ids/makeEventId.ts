import { generateHex } from './generateHex';
import type { EventId } from './typedIds';

/**
 * Create an event ID
 *
 * Format: evt_{6hex}_{seq}
 * Example: evt_f1a2b3_00001
 */
export function makeEventId(seq: number): { id: EventId; hex: string } {
  const hex = generateHex();
  const seqStr = String(seq).padStart(5, '0');

  return { id: `evt_${hex}_${seqStr}` as EventId, hex };
}
