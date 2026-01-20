import type { Database } from 'bun:sqlite';
import type { Agent } from './types';

/**
 * Find an active agent by PID
 * Used to reconnect agents after session changes (e.g., compaction)
 */
export function getAgentByPid(db: Database, pid: number): Agent | null {
  const stmt = db.prepare(`
    SELECT * FROM agents
    WHERE pid = ? AND status = 'active'
    ORDER BY rowid DESC
    LIMIT 1
  `);

  return stmt.get(pid) as Agent | null;
}
