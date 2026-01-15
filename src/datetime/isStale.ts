import { parseDatetime } from './parseDatetime';

/**
 * Check if a timestamp is older than threshold
 *
 * Used for agent liveness checks
 *
 * @param timestamp - Datetime string (2025/01/15 09:14:32 PST)
 * @param thresholdMs - Stale threshold in milliseconds (default 30 seconds)
 */
export function isStale(timestamp: string, thresholdMs: number = 30000): boolean {
  const then = parseDatetime(timestamp);
  const now = new Date();

  return now.getTime() - then.getTime() > thresholdMs;
}
