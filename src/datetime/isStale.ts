import { parseDatetime } from './parseDatetime';

/**
 * Check if a timestamp is older than threshold
 *
 * Used for agent liveness checks
 *
 * @param timestamp - Datetime string (2025/01/15 09:14:32 PST) or null
 * @param thresholdMs - Stale threshold in milliseconds (default 30 seconds)
 * @returns true if stale, including when timestamp is null/undefined
 */
export function isStale(
  timestamp: string | null | undefined,
  thresholdMs: number = 30000
): boolean {
  const then = parseDatetime(timestamp);

  if (!then) {
    return true;
  }

  const now = new Date();
  return now.getTime() - then.getTime() > thresholdMs;
}
