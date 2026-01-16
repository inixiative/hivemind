import { describe, it, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { createTestDb, cleanupAllTestDbs, type TestDb } from '../test/setup';
import { buildAgent, buildPlan } from '../test/factories';
import { createPlan } from './createPlan';
import { getPlan } from './getPlan';
import { getActivePlans } from './getActivePlans';
import { updatePlanStatus } from './updatePlanStatus';

describe('Plans Module', () => {
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

  describe('createPlan', () => {
    it('creates a new plan', () => {
      const { agent } = buildAgent(testDb.db, { label: 'test' });

      const plan = createPlan(testDb.db, {
        title: 'Implement Auth',
        created_by: agent.id,
      });

      expect(plan.id).toMatch(/^pln_[a-f0-9]{6}$/);
      expect(plan.title).toBe('Implement Auth');
      expect(plan.status).toBe('active');
      expect(plan.created_by).toBe(agent.id);
    });

    it('creates plan with label', () => {
      const { agent } = buildAgent(testDb.db);

      const plan = createPlan(testDb.db, {
        title: 'Auth Feature',
        label: 'auth',
        created_by: agent.id,
      });

      expect(plan.id).toMatch(/^pln_[a-f0-9]{6}_auth$/);
      expect(plan.label).toBe('auth');
    });

    it('creates plan with branch', () => {
      const { agent } = buildAgent(testDb.db);

      const plan = createPlan(testDb.db, {
        title: 'Feature Work',
        branch: 'feature/auth',
        created_by: agent.id,
      });

      expect(plan.branch).toBe('feature/auth');
    });

    it('creates plan with description', () => {
      const { agent } = buildAgent(testDb.db);

      const plan = createPlan(testDb.db, {
        title: 'Complex Feature',
        description: 'This plan implements a complex feature with multiple tasks.',
        created_by: agent.id,
      });

      expect(plan.description).toBe('This plan implements a complex feature with multiple tasks.');
    });
  });

  describe('getPlan', () => {
    it('retrieves existing plan', () => {
      const { plan: created } = buildPlan(testDb.db, { title: 'Test Plan' });

      const retrieved = getPlan(testDb.db, created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.title).toBe('Test Plan');
    });

    it('returns null for non-existent plan', () => {
      const plan = getPlan(testDb.db, 'pln_nonexistent');
      expect(plan).toBeNull();
    });
  });

  describe('getActivePlans', () => {
    it('returns only active plans', () => {
      const { plan: plan1 } = buildPlan(testDb.db, { title: 'Active Plan' });
      const { plan: plan2 } = buildPlan(testDb.db, { title: 'Completed Plan' });

      updatePlanStatus(testDb.db, plan2.id, 'complete');

      const active = getActivePlans(testDb.db);

      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(plan1.id);
    });

    it('returns empty array when no active plans', () => {
      const active = getActivePlans(testDb.db);
      expect(active).toHaveLength(0);
    });
  });

  describe('updatePlanStatus', () => {
    it('updates plan to complete', () => {
      const { plan } = buildPlan(testDb.db, { title: 'Test Plan' });

      const success = updatePlanStatus(testDb.db, plan.id, 'complete');
      expect(success).toBe(true);

      const updated = getPlan(testDb.db, plan.id);
      expect(updated!.status).toBe('complete');
    });

    it('updates plan to paused', () => {
      const { plan } = buildPlan(testDb.db, { title: 'Test Plan' });

      const success = updatePlanStatus(testDb.db, plan.id, 'paused');
      expect(success).toBe(true);

      const updated = getPlan(testDb.db, plan.id);
      expect(updated!.status).toBe('paused');
    });

    it('returns false for non-existent plan', () => {
      const result = updatePlanStatus(testDb.db, 'pln_nonexistent', 'complete');
      expect(result).toBe(false);
    });
  });
});
