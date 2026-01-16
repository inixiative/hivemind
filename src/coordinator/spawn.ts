/**
 * Spawn coordinator as a singleton - only starts if not already running
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

type SpawnConfig = {
  project: string;
  dataDir: string;
};

function isCoordinatorRunning(config: SpawnConfig): boolean {
  const pidPath = path.join(config.dataDir, 'coordinator.pid');

  if (!fs.existsSync(pidPath)) {
    return false;
  }

  try {
    const pid = parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);
    process.kill(pid, 0); // Signal 0 = check existence
    return true;
  } catch {
    // Process doesn't exist or can't be signaled
    // Clean up stale PID file
    try {
      fs.unlinkSync(pidPath);
    } catch {
      // Ignore
    }
    return false;
  }
}

/**
 * Upsert coordinator singleton - spawns if not running, no-op if already running
 */
export function ensureCoordinator(config: SpawnConfig): { spawned: boolean; pid?: number } {
  // Check if already running
  if (isCoordinatorRunning(config)) {
    const pidPath = path.join(config.dataDir, 'coordinator.pid');
    const pid = parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);
    return { spawned: false, pid };
  }

  // Spawn coordinator as detached background process
  const coordinatorPath = path.join(__dirname, 'index.ts');

  const child = spawn('bun', ['run', coordinatorPath, config.project, config.dataDir], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env },
  });

  // Detach from parent
  child.unref();

  return { spawned: true, pid: child.pid };
}

/**
 * Get coordinator status
 */
export function getCoordinatorStatus(config: SpawnConfig): { running: boolean; pid?: number } {
  const pidPath = path.join(config.dataDir, 'coordinator.pid');

  if (!fs.existsSync(pidPath)) {
    return { running: false };
  }

  try {
    const pid = parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);
    process.kill(pid, 0);
    return { running: true, pid };
  } catch {
    return { running: false };
  }
}
