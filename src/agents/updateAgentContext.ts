import type Database from 'better-sqlite3';

/**
 * Update an agent's context summary (what it knows/is working on)
 */
export function updateAgentContext(
  db: Database.Database,
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
