import { formatDatetime } from './formatDatetime';

/**
 * Get current timestamp
 *
 * Example: 2025/01/15 09:14:32 PST
 */
export function now(): string {
  return formatDatetime(new Date());
}
