import type Database from 'better-sqlite3';
import { isStale } from '../datetime/isStale';
import type { Agent } from './types';

/**
 * Get agents whose heartbeat is older than threshold
 * Default threshold: 5 minutes
 */
export function getStaleAgents(
  db: Database.Database,
  thresholdMs = 5 * 60 * 1000
): Agent[] {
  const stmt = db.prepare(`
    SELECT * FROM agents
    WHERE status = 'active'
    ORDER BY last_heartbeat ASC
  `);

  const agents = stmt.all() as Agent[];

  return agents.filter(
    (agent) => agent.last_heartbeat && isStale(agent.last_heartbeat, thresholdMs)
  );
}
