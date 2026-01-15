import { formatDate } from './formatDate';
import { formatTime } from './formatTime';

/**
 * Format a Date as yyyy/mm/dd hh:mm:ss TZ
 *
 * Example: 2025/01/15 09:14:32 PST
 */
export function formatDatetime(date: Date = new Date()): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzAbbrev = date.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();

  return `${formatDate(date)} ${formatTime(date)} ${tzAbbrev}`;
}
