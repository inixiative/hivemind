/**
 * Hivemind Coordinator - singleton background process (one per project)
 *
 * Responsibilities:
 * - Periodically check if agent PIDs are still alive
 * - Mark dead agents
 * - Clean up resources
 *
 * Runs indefinitely until killed. Started by first agent join.
 */

import { getConnection } from '../db/getConnection';
import { getActiveAgents } from '../agents/getActiveAgents';
import { markAgentDead } from '../agents/markAgentDead';
import { startPlanWatcher } from '../watcher/planWatcher';
import { emit } from '../events/emit';
import * as fs from 'fs';
import * as path from 'path';

import { parseDatetime } from '../datetime/parseDatetime';

const SWEEP_INTERVAL_MS = 30_000; // 30 seconds
const MIN_AGE_MS = 60_000; // Only kill agents older than 1 minute (grace period)

/**
 * Check if a process is alive
 */
function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0); // Signal 0 = check existence
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an agent is old enough to be considered for cleanup
 */
function isOldEnough(createdAt: string): boolean {
  const created = parseDatetime(createdAt);
  if (!created) return false;
  return Date.now() - created.getTime() > MIN_AGE_MS;
}

type CoordinatorConfig = {
  project: string;
  dataDir: string;
};

function getLockPath(config: CoordinatorConfig): string {
  return path.join(config.dataDir, 'coordinator.lock');
}

function getPidPath(config: CoordinatorConfig): string {
  return path.join(config.dataDir, 'coordinator.pid');
}

function acquireLock(config: CoordinatorConfig): boolean {
  const lockPath = getLockPath(config);
  const pidPath = getPidPath(config);

  try {
    // Check if another coordinator is running
    if (fs.existsSync(pidPath)) {
      const existingPid = parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);

      // Check if process is still alive
      try {
        process.kill(existingPid, 0); // Signal 0 = check if process exists
        // Process exists, can't acquire lock
        return false;
      } catch {
        // Process doesn't exist, stale PID file
        fs.unlinkSync(pidPath);
      }
    }

    // Write our PID
    fs.writeFileSync(pidPath, process.pid.toString());

    // Create lock file
    fs.writeFileSync(lockPath, new Date().toISOString());

    return true;
  } catch (error) {
    console.error('Failed to acquire lock:', error);
    return false;
  }
}

function releaseLock(config: CoordinatorConfig): void {
  try {
    const lockPath = getLockPath(config);
    const pidPath = getPidPath(config);

    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
    if (fs.existsSync(pidPath)) fs.unlinkSync(pidPath);
  } catch {
    // Ignore cleanup errors
  }
}

function sweep(config: CoordinatorConfig): number {
  const db = getConnection(config.project);

  // Get all active agents and check if their PIDs are alive
  const activeAgents = getActiveAgents(db);
  let marked = 0;

  for (const agent of activeAgents) {
    // Skip agents that are too new (grace period)
    if (!isOldEnough(agent.created_at)) {
      continue;
    }

    // If agent has a PID, check if it's still alive
    if (agent.pid && !isProcessAlive(agent.pid)) {
      markAgentDead(db, agent.id);

      // Emit agent:dead system event
      emit(db, {
        type: 'agent:dead',
        agent_id: agent.id,
        worktree_id: agent.worktree_id ?? undefined,
        content: `Agent ${agent.id} died (PID ${agent.pid} no longer running)`,
        metadata: {
          pid: agent.pid,
          label: agent.label,
          current_task_id: agent.current_task_id,
          current_plan_id: agent.current_plan_id,
        },
      });

      marked++;
    }
    // Agents without PIDs are left alone (legacy or manual registration)
  }

  return marked;
}

export function runCoordinator(config: CoordinatorConfig): void {
  // Try to acquire lock
  if (!acquireLock(config)) {
    // Another coordinator is running
    process.exit(0);
  }

  console.log(`[coordinator] Started for ${config.project} (pid: ${process.pid})`);

  // Start the plans watcher (syncs Claude's plan mode files to hivemind)
  const watcher = startPlanWatcher({ project: config.project });

  // Handle shutdown gracefully
  const shutdown = () => {
    console.log('[coordinator] Shutting down...');
    watcher.stop();
    releaseLock(config);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Main loop
  const tick = () => {
    try {
      const marked = sweep(config);

      if (marked > 0) {
        console.log(`[coordinator] Marked ${marked} dead agent(s) (PID gone)`);
      }
    } catch (error) {
      console.error('[coordinator] Sweep error:', error);
    }

    // Schedule next tick
    setTimeout(tick, SWEEP_INTERVAL_MS);
  };

  // Start the loop
  tick();
}

// CLI entry point
if (import.meta.main) {
  const project = process.argv[2];
  const dataDir = process.argv[3];

  if (!project || !dataDir) {
    console.error('Usage: coordinator <project> <dataDir>');
    process.exit(1);
  }

  runCoordinator({ project, dataDir });
}
