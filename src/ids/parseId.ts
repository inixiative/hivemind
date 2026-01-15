import type { IdType, ParsedId } from './types';

/**
 * Parse any hivemind ID into its components
 *
 * Examples:
 *   parseId('agt_7a3f2b')           → { type: 'agt', hex: '7a3f2b' }
 *   parseId('agt_7a3f2b_alice')     → { type: 'agt', hex: '7a3f2b', label: 'alice' }
 *   parseId('tsk_e9d2c1_001')       → { type: 'tsk', hex: 'e9d2c1', seq: '001' }
 *   parseId('tsk_e9d2c1_001.1')     → { type: 'tsk', hex: 'e9d2c1', seq: '001.1' }
 */
export function parseId(id: string): ParsedId {
  const parts = id.split('_');
  const type = parts[0] as IdType;
  const hex = parts[1];

  if (type === 'tsk') {
    const seq = parts[2];
    const label = parts[3];
    return { type, hex, seq, label, raw: id };
  }

  if (type === 'evt') {
    const seq = parts[2];
    return { type, hex, seq, raw: id };
  }

  // agt or pln: type_hex or type_hex_label
  const label = parts[2];
  return { type, hex, label, raw: id };
}
