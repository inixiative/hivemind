import type { Database } from 'bun:sqlite';

/**
 * Update an agent's context summary (what it knows/is working on)
 */
export function updateAgentContext(
  db: Database,
  agentId: string,
  contextSummary: string
): boolean {
  const stmt = db.prepare(`
    UPDATE agents
    SET context_summary = ?
    WHERE id = ?
  `);

  const result = stmt.run(contextSummary, agentId);
  return result.changes > 0;
}
