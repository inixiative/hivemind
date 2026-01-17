import { describe, it, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { createTestDb, cleanupAllTestDbs, type TestDb } from '../test/setup';
import { buildAgent, buildPlan, buildTask } from '../test/factories';
import { nextEventSeq } from './nextEventSeq';
import { nextTaskSeq } from './nextTaskSeq';

describe('SQLite Database', () => {
  let testDb: TestDb;

  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    testDb.cleanup();
  });

  afterAll(() => {
    cleanupAllTestDbs();
  });

  describe('schema initialization', () => {
    it('creates all required tables', () => {
      const tables = testDb.db
        .prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
        )
        .all() as { name: string }[];

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain('agents');
      expect(tableNames).toContain('worktrees');
      expect(tableNames).toContain('plans');
      expect(tableNames).toContain('tasks');
      expect(tableNames).toContain('events');
    });

    it('creates indexes', () => {
      const indexes = testDb.db
        .prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'`)
        .all() as { name: string }[];

      expect(indexes.length).toBeGreaterThan(0);
    });
  });

  describe('journal mode', () => {
    it('uses memory journal mode for in-memory test db', () => {
      const result = testDb.db.query('PRAGMA journal_mode').get() as { journal_mode: string };
      // In-memory databases use 'memory' journal mode
      expect(result.journal_mode).toBe('memory');
    });
  });

  describe('basic CRUD operations', () => {
    it('can insert and select agents', () => {
      const { agent } = buildAgent(testDb.db, { label: 'test' });

      const retrieved = testDb.db.prepare(`SELECT * FROM agents WHERE id = ?`).get(agent.id) as {
        id: string;
        status: string;
      };

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(agent.id);
      expect(retrieved.status).toBe('active');
    });

    it('can insert and select plans', () => {
      const { plan } = buildPlan(testDb.db, { title: 'Test Plan' });

      const retrieved = testDb.db.prepare(`SELECT * FROM plans WHERE id = ?`).get(plan.id) as {
        id: string;
        title: string;
      };

      expect(retrieved).toBeDefined();
      expect(retrieved.title).toBe('Test Plan');
    });

    it('can insert and select tasks', () => {
      const { task } = buildTask(testDb.db, { title: 'Test Task' });

      const retrieved = testDb.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(task.id) as {
        id: string;
        title: string;
        status: string;
      };

      expect(retrieved).toBeDefined();
      expect(retrieved.title).toBe('Test Task');
      expect(retrieved.status).toBe('pending');
    });

    it('can insert and select events', () => {
      const { agent } = buildAgent(testDb.db);

      const eventId = 'evt_abc123_1';
      testDb.db
        .prepare(
          `INSERT INTO events (id, hex, seq, timestamp, agent_id, event_type, content)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(eventId, 'abc123', 1, '2024/01/01 00:00:00 UTC', agent.id, 'note', 'Test event');

      const event = testDb.db.prepare(`SELECT * FROM events WHERE id = ?`).get(eventId) as {
        id: string;
        event_type: string;
        content: string;
      };

      expect(event).toBeDefined();
      expect(event.event_type).toBe('note');
      expect(event.content).toBe('Test event');
    });
  });

  describe('foreign key constraints', () => {
    it('enforces task->plan foreign key', () => {
      expect(() => {
        testDb.db
          .prepare(
            `INSERT INTO tasks (id, plan_hex, seq, plan_id, title, status)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run('tsk_test01_01', 'test01', '01', 'nonexistent_plan', 'Test Task', 'pending');
      }).toThrow();
    });
  });
});

describe('nextEventSeq', () => {
  let testDb: TestDb;

  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    testDb.cleanup();
  });

  it('returns 1 for first event', () => {
    const seq = nextEventSeq(testDb.db);
    expect(seq).toBe(1);
  });

  it('increments sequence atomically', () => {
    const seq1 = nextEventSeq(testDb.db);
    const seq2 = nextEventSeq(testDb.db);
    const seq3 = nextEventSeq(testDb.db);

    expect(seq1).toBe(1);
    expect(seq2).toBe(2);
    expect(seq3).toBe(3);
  });
});

describe('nextTaskSeq', () => {
  let testDb: TestDb;

  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    testDb.cleanup();
  });

  it('returns 1 for first task in plan', () => {
    const { plan } = buildPlan(testDb.db);

    const seq = nextTaskSeq(testDb.db, plan.id);
    expect(seq).toBe(1);
  });

  it('increments sequence as tasks are added', () => {
    const { plan } = buildPlan(testDb.db);

    // Insert first task using factory
    buildTask(testDb.db, { plan, title: 'Task 1' });

    const seq = nextTaskSeq(testDb.db, plan.id);
    expect(seq).toBe(2);
  });

  it('only counts top-level tasks (not subtasks)', () => {
    const { plan } = buildPlan(testDb.db);
    const { task: parentTask } = buildTask(testDb.db, { plan, title: 'Task 1' });

    // Insert a subtask manually (factories don't support this yet)
    const planHex = parentTask.id.split('_')[1];
    testDb.db
      .prepare(
        `INSERT INTO tasks (id, plan_hex, seq, plan_id, title, status, parent_task_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(`tsk_${planHex}_001.1`, planHex, '001.1', plan.id, 'Subtask 1', 'pending', parentTask.id);

    // Should still be 2 (subtask doesn't count)
    const seq = nextTaskSeq(testDb.db, plan.id);
    expect(seq).toBe(2);
  });
});
