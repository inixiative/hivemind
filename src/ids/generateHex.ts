import { randomBytes } from 'crypto';

/**
 * Generate a 6-character hex string for use in IDs
 */
export function generateHex(): string {
  return randomBytes(3).toString('hex');
}
