import type { Database } from 'bun:sqlite';
import type { Agent } from './types';

/**
 * Get an active agent by session ID
 *
 * Used for MCP tools to find "their" agent without needing the agent_id.
 * The session_id is passed by Claude Code to hooks and can be used to
 * correlate the hook-registered agent with subsequent MCP calls.
 */
export function getAgentBySessionId(
  db: Database,
  sessionId: string
): Agent | null {
  const stmt = db.prepare(`
    SELECT * FROM agents
    WHERE session_id = ?
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `);

  return (stmt.get(sessionId) as Agent) ?? null;
}
