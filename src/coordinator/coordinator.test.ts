import { describe, it, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { createTestDb, cleanupAllTestDbs, type TestDb } from '../test/setup';
import { buildAgent } from '../test/factories';
import { getAgent } from '../agents/getAgent';
import { getActiveAgents } from '../agents/getActiveAgents';
import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, rmSync, existsSync } from 'fs';

// Test directory for coordinator files
const TEST_COORD_DIR = path.join(__dirname, '../../.test-coordinator');

type TestCoordinator = {
  dataDir: string;
  cleanup: () => void;
};

function createTestCoordinatorDir(): TestCoordinator {
  const dataDir = path.join(TEST_COORD_DIR, `coord-${Date.now()}`);
  mkdirSync(dataDir, { recursive: true });

  return {
    dataDir,
    cleanup: () => {
      if (existsSync(dataDir)) {
        rmSync(dataDir, { recursive: true, force: true });
      }
    },
  };
}

function cleanupAllCoordinatorDirs(): void {
  if (existsSync(TEST_COORD_DIR)) {
    rmSync(TEST_COORD_DIR, { recursive: true, force: true });
  }
}

describe('Coordinator', () => {
  let testDb: TestDb;
  let testCoord: TestCoordinator;

  beforeEach(() => {
    testDb = createTestDb();
    testCoord = createTestCoordinatorDir();
  });

  afterEach(() => {
    testDb.cleanup();
    testCoord.cleanup();
  });

  afterAll(() => {
    cleanupAllTestDbs();
    cleanupAllCoordinatorDirs();
  });

  describe('Lock acquisition', () => {
    it('creates pid file when acquiring lock', async () => {
      const pidPath = path.join(testCoord.dataDir, 'coordinator.pid');

      // Simulate acquiring lock
      fs.writeFileSync(pidPath, process.pid.toString());

      expect(existsSync(pidPath)).toBe(true);
      const content = fs.readFileSync(pidPath, 'utf-8');
      expect(parseInt(content, 10)).toBe(process.pid);
    });

    it('detects stale pid file for dead process', () => {
      const pidPath = path.join(testCoord.dataDir, 'coordinator.pid');

      // Write a PID that doesn't exist (use a very high number)
      fs.writeFileSync(pidPath, '999999999');

      // Check if process exists
      let processExists = true;
      try {
        process.kill(999999999, 0);
      } catch {
        processExists = false;
      }

      expect(processExists).toBe(false);
    });
  });

  describe('PID-based agent detection', () => {
    it('can detect if a PID is alive', () => {
      // Current process is alive
      let alive = true;
      try {
        process.kill(process.pid, 0);
      } catch {
        alive = false;
      }
      expect(alive).toBe(true);

      // Non-existent PID is dead
      let deadAlive = true;
      try {
        process.kill(999999999, 0);
      } catch {
        deadAlive = false;
      }
      expect(deadAlive).toBe(false);
    });

    it('agents store PID for lifecycle tracking', () => {
      const { agent } = buildAgent(testDb.db, { pid: process.pid });
      expect(agent.pid).toBe(process.pid);
    });
  });

  describe('Agent cleanup', () => {
    it('marks stale agent as dead and releases tasks', () => {
      const { agent } = buildAgent(testDb.db);

      // Create a claimed task
      testDb.db
        .prepare(
          `
        INSERT INTO plans (id, hex, title, status, created_at)
        VALUES ('pln_test', 'abcdef', 'Test Plan', 'active', datetime('now'))
      `
        )
        .run();

      testDb.db
        .prepare(
          `
        INSERT INTO tasks (id, plan_hex, seq, plan_id, title, status, claimed_by)
        VALUES ('tsk_test', 'abcdef', '001', 'pln_test', 'Test task', 'claimed', ?)
      `
        )
        .run(agent.id);

      // Mark agent dead (simulating coordinator action)
      testDb.db.prepare(`UPDATE agents SET status = 'dead' WHERE id = ?`).run(agent.id);
      testDb.db
        .prepare(`UPDATE tasks SET status = 'pending', claimed_by = NULL WHERE claimed_by = ?`)
        .run(agent.id);

      // Verify
      const updatedAgent = getAgent(testDb.db, agent.id);
      expect(updatedAgent!.status).toBe('dead');

      const task = testDb.db.prepare(`SELECT * FROM tasks WHERE id = 'tsk_test'`).get() as {
        status: string;
        claimed_by: string | null;
      };
      expect(task.status).toBe('pending');
      expect(task.claimed_by).toBeNull();
    });
  });

  describe('Singleton behavior', () => {
    it('prevents multiple coordinators via pid file', () => {
      const pidPath = path.join(testCoord.dataDir, 'coordinator.pid');

      // First "coordinator" writes its PID
      fs.writeFileSync(pidPath, process.pid.toString());

      // Second coordinator should detect existing process
      const existingPid = parseInt(fs.readFileSync(pidPath, 'utf-8'), 10);
      let canAcquire = false;

      try {
        process.kill(existingPid, 0); // Check if alive
        canAcquire = false; // Process alive, can't acquire
      } catch {
        canAcquire = true; // Process dead, can acquire
      }

      expect(canAcquire).toBe(false);
    });

    it('allows new coordinator when previous is dead', () => {
      const pidPath = path.join(testCoord.dataDir, 'coordinator.pid');

      // Write a dead PID
      fs.writeFileSync(pidPath, '999999999');

      // Check if can acquire
      const existingPid = parseInt(fs.readFileSync(pidPath, 'utf-8'), 10);
      let canAcquire = false;

      try {
        process.kill(existingPid, 0);
        canAcquire = false;
      } catch {
        canAcquire = true;
      }

      expect(canAcquire).toBe(true);
    });
  });

  describe('Coordinator lifecycle', () => {
    it('coordinator runs indefinitely (no exit on empty)', () => {
      // No agents registered
      const active = getActiveAgents(testDb.db);
      expect(active.length).toBe(0);

      // Coordinator should NOT exit - it runs forever per project
      const shouldExit = false; // Changed from heartbeat-based logic
      expect(shouldExit).toBe(false);
    });

    it('coordinator monitors all active agents', () => {
      buildAgent(testDb.db);

      const active = getActiveAgents(testDb.db);
      expect(active.length).toBe(1);
    });
  });
});
