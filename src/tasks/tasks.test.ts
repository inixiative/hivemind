import { describe, it, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { createTestDb, cleanupAllTestDbs, type TestDb } from '../test/setup';
import { buildAgent, buildPlan, buildTask } from '../test/factories';
import { createTask } from './createTask';
import { getTask } from './getTask';
import { getTasksByPlan } from './getTasksByPlan';
import { getPendingTasks } from './getPendingTasks';
import { claimTask } from './claimTask';
import { assignTask } from './assignTask';
import { unclaimTask } from './unclaimTask';
import { startTask } from './startTask';
import { completeTask } from './completeTask';
import { blockTask } from './blockTask';

describe('Tasks Module', () => {
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

  describe('createTask', () => {
    it('creates a task with auto-generated seq', () => {
      const { plan } = buildPlan(testDb.db);

      const task = createTask(testDb.db, {
        plan_id: plan.id,
        title: 'Implement login',
      });

      expect(task.id).toBe(`tsk_${plan.hex}_001`);
      expect(task.title).toBe('Implement login');
      expect(task.status).toBe('pending');
      expect(task.plan_id).toBe(plan.id);
    });

    it('increments sequence for multiple tasks', () => {
      const { plan } = buildPlan(testDb.db);

      const task1 = createTask(testDb.db, { plan_id: plan.id, title: 'Task 1' });
      const task2 = createTask(testDb.db, { plan_id: plan.id, title: 'Task 2' });
      const task3 = createTask(testDb.db, { plan_id: plan.id, title: 'Task 3' });

      expect(task1.seq).toBe('001');
      expect(task2.seq).toBe('002');
      expect(task3.seq).toBe('003');
    });

    it('creates task with label', () => {
      const { plan } = buildPlan(testDb.db);

      const task = createTask(testDb.db, {
        plan_id: plan.id,
        title: 'Setup Database',
        label: 'setup',
      });

      expect(task.id).toBe(`tsk_${plan.hex}_001_setup`);
      expect(task.label).toBe('setup');
    });

    it('creates task with description', () => {
      const { plan } = buildPlan(testDb.db);

      const task = createTask(testDb.db, {
        plan_id: plan.id,
        title: 'Complex Task',
        description: 'This task requires multiple steps.',
      });

      expect(task.description).toBe('This task requires multiple steps.');
    });

    it('creates task with branch', () => {
      const { plan } = buildPlan(testDb.db);

      const task = createTask(testDb.db, {
        plan_id: plan.id,
        title: 'Feature Task',
        branch: 'feature/specific',
      });

      expect(task.branch).toBe('feature/specific');
    });
  });

  describe('getTask', () => {
    it('retrieves existing task', () => {
      const { task: created } = buildTask(testDb.db, { title: 'Test Task' });
      const retrieved = getTask(testDb.db, created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.title).toBe('Test Task');
    });

    it('returns null for non-existent task', () => {
      const task = getTask(testDb.db, 'tsk_nonexistent_01');
      expect(task).toBeNull();
    });
  });

  describe('getTasksByPlan', () => {
    it('returns all tasks for plan', () => {
      const { plan } = buildPlan(testDb.db);

      buildTask(testDb.db, { plan, title: 'Task 1' });
      buildTask(testDb.db, { plan, title: 'Task 2' });
      buildTask(testDb.db, { plan, title: 'Task 3' });

      const tasks = getTasksByPlan(testDb.db, plan.id);

      expect(tasks).toHaveLength(3);
    });

    it('returns tasks in sequence order', () => {
      const { plan } = buildPlan(testDb.db);

      buildTask(testDb.db, { plan, title: 'First' });
      buildTask(testDb.db, { plan, title: 'Second' });
      buildTask(testDb.db, { plan, title: 'Third' });

      const tasks = getTasksByPlan(testDb.db, plan.id);

      expect(tasks[0].title).toBe('First');
      expect(tasks[1].title).toBe('Second');
      expect(tasks[2].title).toBe('Third');
    });
  });

  describe('getPendingTasks', () => {
    it('returns only pending tasks', () => {
      const { agent } = buildAgent(testDb.db, { label: 'test' });
      const { plan } = buildPlan(testDb.db, { agent });

      const { task: task1 } = buildTask(testDb.db, { plan, title: 'Pending' });
      const { task: task2 } = buildTask(testDb.db, { plan, title: 'To be claimed' });

      // Claim task2 so it's no longer pending
      claimTask(testDb.db, task2.id, agent.id);

      const pending = getPendingTasks(testDb.db);

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(task1.id);
    });
  });

  describe('claimTask', () => {
    it('claims task for agent', () => {
      const { agent } = buildAgent(testDb.db);
      const { task } = buildTask(testDb.db, { title: 'Test Task' });

      const claimed = claimTask(testDb.db, task.id, agent.id);

      expect(claimed).toBeDefined();
      expect(claimed!.claimed_by).toBe(agent.id);
      expect(claimed!.claimed_at).toBeDefined();
    });

    it('returns null if task already claimed', () => {
      const { agent: agent1 } = buildAgent(testDb.db, { label: 'one' });
      const { agent: agent2 } = buildAgent(testDb.db, { label: 'two' });
      const { task } = buildTask(testDb.db, { title: 'Test Task' });

      claimTask(testDb.db, task.id, agent1.id);
      const result = claimTask(testDb.db, task.id, agent2.id);

      expect(result).toBeNull();
    });
  });

  describe('assignTask', () => {
    it('assigns task to agent (even if claimed)', () => {
      const { agent: agent1 } = buildAgent(testDb.db, { label: 'one' });
      const { agent: agent2 } = buildAgent(testDb.db, { label: 'two' });
      const { task } = buildTask(testDb.db, { title: 'Test Task' });

      claimTask(testDb.db, task.id, agent1.id);
      const assigned = assignTask(testDb.db, task.id, agent2.id);

      expect(assigned).toBeDefined();
      expect(assigned!.claimed_by).toBe(agent2.id);
    });
  });

  describe('unclaimTask', () => {
    it('releases task claim', () => {
      const { agent } = buildAgent(testDb.db);
      const { task } = buildTask(testDb.db, { title: 'Test Task' });

      claimTask(testDb.db, task.id, agent.id);

      const success = unclaimTask(testDb.db, task.id);
      expect(success).toBe(true);

      // Verify the task was updated
      const updated = getTask(testDb.db, task.id);
      expect(updated!.claimed_by).toBeNull();
      expect(updated!.claimed_at).toBeNull();
      expect(updated!.status).toBe('pending');
    });
  });

  describe('startTask', () => {
    it('changes status to in_progress', () => {
      const { agent } = buildAgent(testDb.db);
      const { task } = buildTask(testDb.db, { title: 'Test Task' });

      // Must claim first since startTask requires 'claimed' status
      claimTask(testDb.db, task.id, agent.id);

      const success = startTask(testDb.db, task.id);
      expect(success).toBe(true);

      // Verify the task was updated
      const updated = getTask(testDb.db, task.id);
      expect(updated!.status).toBe('in_progress');
    });
  });

  describe('completeTask', () => {
    it('changes status to done', () => {
      const { agent } = buildAgent(testDb.db);
      const { task } = buildTask(testDb.db, { title: 'Test Task' });

      // Must claim first since completeTask requires 'claimed' or 'in_progress'
      claimTask(testDb.db, task.id, agent.id);

      const completed = completeTask(testDb.db, task.id);

      expect(completed).toBeDefined();
      expect(completed!.status).toBe('done');
      expect(completed!.completed_at).toBeDefined();
    });

    it('stores outcome', () => {
      const { agent } = buildAgent(testDb.db);
      const { task } = buildTask(testDb.db, { title: 'Test Task' });

      claimTask(testDb.db, task.id, agent.id);

      const completed = completeTask(testDb.db, task.id, 'Successfully implemented');

      expect(completed!.outcome).toBe('Successfully implemented');
    });
  });

  describe('blockTask', () => {
    it('changes status to blocked', () => {
      const { agent } = buildAgent(testDb.db);
      const { task } = buildTask(testDb.db, { title: 'Test Task' });

      // Must claim first since blockTask requires 'claimed' or 'in_progress'
      claimTask(testDb.db, task.id, agent.id);

      const success = blockTask(testDb.db, task.id, 'Waiting for API');
      expect(success).toBe(true);

      // Verify the task was updated
      const updated = getTask(testDb.db, task.id);
      expect(updated!.status).toBe('blocked');
    });
  });
});
