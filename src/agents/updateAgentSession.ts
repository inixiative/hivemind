import type { Database } from 'bun:sqlite';
import { now } from '../datetime/now';

/**
 * Update an agent's session ID
 * Called when conversation compacts and gets a new session ID
 */
export function updateAgentSession(
  db: Database,
  agentId: string,
  sessionId: string
): void {
  const timestamp = now();
  const stmt = db.prepare(`
    UPDATE agents SET session_id = ?, last_seen_at = ? WHERE id = ?
  `);
  stmt.run(sessionId, timestamp, agentId);
}
