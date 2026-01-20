import type { Database } from 'bun:sqlite';

/**
 * Update an agent's session ID
 * Called when conversation compacts and gets a new session ID
 */
export function updateAgentSession(
  db: Database,
  agentId: string,
  sessionId: string
): void {
  const stmt = db.prepare(`
    UPDATE agents SET session_id = ? WHERE id = ?
  `);
  stmt.run(sessionId, agentId);
}
