/**
 * Validate an ID format
 *
 * Checks:
 *   - Has at least 2 parts (type_hex)
 *   - Type is valid (agt, pln, tsk, evt)
 *   - Hex is 6 lowercase hex chars
 */
export function isValidId(id: string): boolean {
  const validTypes = ['agt', 'pln', 'tsk', 'evt'];
  const parts = id.split('_');

  if (parts.length < 2) {
    return false;
  }

  if (!validTypes.includes(parts[0])) {
    return false;
  }

  if (!/^[a-f0-9]{6}$/.test(parts[1])) {
    return false;
  }

  return true;
}
