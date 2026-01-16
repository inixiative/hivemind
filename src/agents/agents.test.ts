import { describe, it, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { createTestDb, cleanupAllTestDbs, type TestDb } from '../test/setup';
import { buildAgent, buildTask } from '../test/factories';
import { registerAgent } from './registerAgent';
import { getAgent } from './getAgent';
import { getActiveAgents } from './getActiveAgents';
import { markAgentDead } from './markAgentDead';
import { markAgentIdle } from './markAgentIdle';
import { updateAgentContext } from './updateAgentContext';
import { updateAgentTask } from './updateAgentTask';
import { unregisterAgent } from './unregisterAgent';

describe('Agents Module', () => {
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

  describe('registerAgent', () => {
    it('creates a new agent with generated id', () => {
      const agent = registerAgent(testDb.db, {});

      expect(agent.id).toMatch(/^agt_[a-f0-9]{6}$/);
      expect(agent.status).toBe('active');
      expect(agent.created_at).toBeDefined();
    });

    it('creates agent with label', () => {
      const agent = registerAgent(testDb.db, { label: 'main' });

      expect(agent.id).toMatch(/^agt_[a-f0-9]{6}_main$/);
      expect(agent.label).toBe('main');
    });

    it('creates agent with context summary', () => {
      const agent = registerAgent(testDb.db, {
        context_summary: 'Working on auth feature',
      });

      expect(agent.context_summary).toBe('Working on auth feature');
    });
  });

  describe('getAgent', () => {
    it('retrieves existing agent', () => {
      const { agent: created } = buildAgent(testDb.db, { label: 'test' });
      const retrieved = getAgent(testDb.db, created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.label).toBe('test');
    });

    it('returns null for non-existent agent', () => {
      const agent = getAgent(testDb.db, 'agt_nonexistent');
      expect(agent).toBeNull();
    });
  });

  describe('getActiveAgents', () => {
    it('returns only active agents', () => {
      const { agent: agent1 } = buildAgent(testDb.db, { label: 'one' });
      const { agent: agent2 } = buildAgent(testDb.db, { label: 'two' });
      markAgentDead(testDb.db, agent2.id);

      const active = getActiveAgents(testDb.db);

      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(agent1.id);
    });

    it('returns empty array when no active agents', () => {
      const active = getActiveAgents(testDb.db);
      expect(active).toHaveLength(0);
    });
  });

  describe('markAgentDead', () => {
    it('sets status to dead', () => {
      const { agent } = buildAgent(testDb.db);
      markAgentDead(testDb.db, agent.id);

      const retrieved = getAgent(testDb.db, agent.id);
      expect(retrieved!.status).toBe('dead');
    });

    it('releases claimed tasks back to pending', () => {
      const { agent } = buildAgent(testDb.db);
      const { task } = buildTask(testDb.db, {
        agent,
        status: 'claimed',
        claimed_by: agent,
      });

      markAgentDead(testDb.db, agent.id);

      const updated = testDb.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(task.id) as {
        status: string;
        claimed_by: string | null;
        claimed_at: string | null;
      };

      expect(updated.status).toBe('pending');
      expect(updated.claimed_by).toBeNull();
      expect(updated.claimed_at).toBeNull();
    });

    it('releases in_progress tasks back to pending', () => {
      const { agent } = buildAgent(testDb.db);
      const { task } = buildTask(testDb.db, {
        agent,
        status: 'in_progress',
        claimed_by: agent,
      });

      markAgentDead(testDb.db, agent.id);

      const updated = testDb.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(task.id) as {
        status: string;
        claimed_by: string | null;
      };

      expect(updated.status).toBe('pending');
      expect(updated.claimed_by).toBeNull();
    });

    it('clears agent current_task_id and current_plan_id', () => {
      const { agent } = buildAgent(testDb.db);
      const { task, plan } = buildTask(testDb.db, { agent });

      updateAgentTask(testDb.db, agent.id, plan.id, task.id);

      let retrieved = getAgent(testDb.db, agent.id);
      expect(retrieved!.current_plan_id).toBe(plan.id);
      expect(retrieved!.current_task_id).toBe(task.id);

      markAgentDead(testDb.db, agent.id);

      retrieved = getAgent(testDb.db, agent.id);
      expect(retrieved!.current_plan_id).toBeNull();
      expect(retrieved!.current_task_id).toBeNull();
    });

    it('does not affect done tasks', () => {
      const { agent } = buildAgent(testDb.db);
      const { task } = buildTask(testDb.db, {
        agent,
        status: 'done',
        claimed_by: agent,
      });

      markAgentDead(testDb.db, agent.id);

      const updated = testDb.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(task.id) as {
        status: string;
        claimed_by: string | null;
      };

      expect(updated.status).toBe('done');
      expect(updated.claimed_by).toBe(agent.id);
    });
  });

  describe('markAgentIdle', () => {
    it('sets status to idle', () => {
      const { agent } = buildAgent(testDb.db);
      markAgentIdle(testDb.db, agent.id);

      const retrieved = getAgent(testDb.db, agent.id);
      expect(retrieved!.status).toBe('idle');
    });
  });

  describe('updateAgentContext', () => {
    it('updates context summary', () => {
      const { agent } = buildAgent(testDb.db);
      updateAgentContext(testDb.db, agent.id, 'New context');

      const retrieved = getAgent(testDb.db, agent.id);
      expect(retrieved!.context_summary).toBe('New context');
    });
  });

  describe('updateAgentTask', () => {
    it('updates current plan and task id', () => {
      const { agent } = buildAgent(testDb.db);
      const { task, plan } = buildTask(testDb.db, { agent });

      updateAgentTask(testDb.db, agent.id, plan.id, task.id);

      const retrieved = getAgent(testDb.db, agent.id);
      expect(retrieved!.current_plan_id).toBe(plan.id);
      expect(retrieved!.current_task_id).toBe(task.id);
    });

    it('clears plan and task with null', () => {
      const { agent } = buildAgent(testDb.db);
      updateAgentTask(testDb.db, agent.id, null, null);

      const retrieved = getAgent(testDb.db, agent.id);
      expect(retrieved!.current_plan_id).toBeNull();
      expect(retrieved!.current_task_id).toBeNull();
    });
  });

  describe('unregisterAgent', () => {
    it('removes agent from database', () => {
      const { agent } = buildAgent(testDb.db);
      unregisterAgent(testDb.db, agent.id);

      const retrieved = getAgent(testDb.db, agent.id);
      expect(retrieved).toBeNull();
    });
  });
});
