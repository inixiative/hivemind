/**
 * Parse a datetime string to Date
 *
 * Input: 2025/01/15 09:14:32 PST
 * Returns: Date object
 */
export function parseDatetime(datetimeStr: string): Date {
  // Remove timezone abbreviation for parsing
  const withoutTz = datetimeStr.replace(/\s+[A-Z]{3,4}$/, '');
  const [datePart, timePart] = withoutTz.split(' ');
  const [year, month, day] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);

  return new Date(year, month - 1, day, hours, minutes, seconds);
}
