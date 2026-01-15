import { formatDate } from './formatDate';

/**
 * Get today's date (for filenames)
 *
 * Example: 2025/01/15
 */
export function today(): string {
  return formatDate(new Date());
}
