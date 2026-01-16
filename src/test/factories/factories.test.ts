import { describe, it, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { createTestDb, cleanupAllTestDbs, type TestDb } from '../setup';
import { buildAgent } from './agentFactory';
import { buildPlan } from './planFactory';
import { buildTask } from './taskFactory';
import { buildEvent } from './eventFactory';

describe('Test Factories', () => {
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

  describe('buildAgent', () => {
    it('creates agent with defaults', () => {
      const { agent } = buildAgent(testDb.db);

      expect(agent.id).toMatch(/^agt_[a-f0-9]{6}$/);
      expect(agent.status).toBe('active');
    });

    it('creates agent with label', () => {
      const { agent } = buildAgent(testDb.db, { label: 'worker' });

      expect(agent.id).toMatch(/^agt_[a-f0-9]{6}_worker$/);
      expect(agent.label).toBe('worker');
    });
  });

  describe('buildPlan', () => {
    it('creates plan and agent', () => {
      const { plan, agent } = buildPlan(testDb.db);

      expect(plan.id).toMatch(/^pln_[a-f0-9]{6}$/);
      expect(plan.title).toBe('Test Plan');
      expect(plan.created_by).toBe(agent.id);
    });

    it('uses existing agent', () => {
      const { agent: existingAgent } = buildAgent(testDb.db, { label: 'lead' });
      const { plan, agent } = buildPlan(testDb.db, { agent: existingAgent });

      expect(plan.created_by).toBe(existingAgent.id);
      expect(agent.id).toBe(existingAgent.id);
    });

    it('accepts custom title', () => {
      const { plan } = buildPlan(testDb.db, { title: 'Auth Feature' });

      expect(plan.title).toBe('Auth Feature');
    });
  });

  describe('buildTask', () => {
    it('creates task with plan and agent', () => {
      const { task, plan, agent } = buildTask(testDb.db);

      expect(task.id).toMatch(/^tsk_[a-f0-9]{6}_001$/);
      expect(task.plan_id).toBe(plan.id);
      expect(task.status).toBe('pending');
      expect(plan.created_by).toBe(agent.id);
    });

    it('uses existing plan', () => {
      const { plan: existingPlan, agent: existingAgent } = buildPlan(testDb.db, { title: 'My Plan' });
      const { task, plan, agent } = buildTask(testDb.db, { plan: existingPlan });

      expect(task.plan_id).toBe(existingPlan.id);
      expect(plan.id).toBe(existingPlan.id);
      expect(agent.id).toBe(existingAgent.id);
    });

    it('creates claimed task', () => {
      const { agent: claimer } = buildAgent(testDb.db, { label: 'claimer' });
      const { task } = buildTask(testDb.db, {
        status: 'claimed',
        claimed_by: claimer,
      });

      expect(task.status).toBe('claimed');
      expect(task.claimed_by).toBe(claimer.id);
    });
  });

  describe('buildEvent', () => {
    it('creates event with agent', () => {
      const { event, agent } = buildEvent(testDb.db);

      expect(event.id).toMatch(/^evt_[a-f0-9]{6}_\d+$/);
      expect(event.agent_id).toBe(agent.id);
      expect(event.event_type).toBe('note');
      expect(event.content).toBe('Test event');
    });

    it('uses existing agent', () => {
      const { agent: existingAgent } = buildAgent(testDb.db, { label: 'emitter' });
      const { event, agent } = buildEvent(testDb.db, { agent: existingAgent });

      expect(event.agent_id).toBe(existingAgent.id);
      expect(agent.id).toBe(existingAgent.id);
    });

    it('creates event with plan and task', () => {
      const { task, plan, agent } = buildTask(testDb.db);
      const { event } = buildEvent(testDb.db, {
        agent,
        plan,
        task,
        type: 'task:start',
        content: 'Starting work',
      });

      expect(event.plan_id).toBe(plan.id);
      expect(event.task_id).toBe(task.id);
      expect(event.event_type).toBe('task:start');
    });
  });
});
