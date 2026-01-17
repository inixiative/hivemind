import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { executeStatus } from './status';
import { createTestDb, type TestDb } from '../../test/setup';
import { buildAgent } from '../../test/factories/agentFactory';
import { buildWorktree } from '../../test/factories/worktreeFactory';
import { buildEvent } from '../../test/factories/eventFactory';
import { buildPlan } from '../../test/factories/planFactory';
import { buildTask } from '../../test/factories/taskFactory';

describe('executeStatus', () => {
  let testDb: TestDb;

  beforeEach(() => {
    testDb = createTestDb();
  });

  afterEach(() => {
    testDb.cleanup();
  });

  it('returns basic status for empty project', () => {
    const result = executeStatus({ project: testDb.project });

    expect(result.project).toBe(testDb.project);
    expect(result.summary).toContain(testDb.project);
    expect(result.metrics.activeAgents).toBe(0);
    expect(result.metrics.totalWorktrees).toBe(0);
    expect(result.metrics.plansWithWork).toBe(0);
    expect(result.metrics.eventsThisWeek).toBe(0);
    expect(result.worktrees).toEqual([]);
    expect(result.recentEvents).toEqual([]);
  });

  it('includes worktree with agent mapping', () => {
    const worktree = buildWorktree(testDb.db, { branch: 'main' });
    const { agent } = buildAgent(testDb.db, { worktree_id: worktree.id });

    const result = executeStatus({ project: testDb.project });

    expect(result.metrics.activeAgents).toBe(1);
    expect(result.metrics.totalWorktrees).toBe(1);
    expect(result.worktrees).toHaveLength(1);
    expect(result.worktrees[0].agents).toHaveLength(1);
    expect(result.worktrees[0].agents[0].id).toBe(agent.id);
  });

  it('computes event metrics by day and type', () => {
    const { agent } = buildAgent(testDb.db);

    // Create events
    buildEvent(testDb.db, { agent, type: 'decision' });
    buildEvent(testDb.db, { agent, type: 'decision' });
    buildEvent(testDb.db, { agent, type: 'context' });
    buildEvent(testDb.db, { agent, type: 'note' });

    const result = executeStatus({ project: testDb.project });

    expect(result.metrics.eventsThisWeek).toBe(4);
    expect(result.activity.total).toBe(4);
    expect(result.activity.byType.decision).toBe(2);
    expect(result.activity.byType.context).toBe(1);
    expect(result.activity.byType.note).toBe(1);
    expect(result.activity.byDay.length).toBeGreaterThan(0);
  });

  it('includes plans with task counts', () => {
    buildAgent(testDb.db);
    const { plan } = buildPlan(testDb.db);

    // Create tasks with different statuses
    buildTask(testDb.db, { plan, status: 'pending' });
    buildTask(testDb.db, { plan, status: 'pending' });
    buildTask(testDb.db, { plan, status: 'in_progress' });
    buildTask(testDb.db, { plan, status: 'done' });

    const result = executeStatus({ project: testDb.project });

    expect(result.plans).toHaveLength(1);
    expect(result.plans[0].taskCounts.pending).toBe(2);
    expect(result.plans[0].taskCounts.in_progress).toBe(1);
    expect(result.plans[0].taskCounts.done).toBe(1);
    expect(result.plans[0].taskCounts.total).toBe(4);
  });

  it('filters worktree events by branch', () => {
    const wt1 = buildWorktree(testDb.db, { branch: 'main' });
    buildWorktree(testDb.db, { branch: 'feature' });
    const { agent } = buildAgent(testDb.db, { worktree_id: wt1.id });

    // Events on main branch
    buildEvent(testDb.db, { agent, branch: 'main', type: 'note' });
    buildEvent(testDb.db, { agent, branch: 'main', type: 'note' });

    // Events on feature branch
    buildEvent(testDb.db, { agent, branch: 'feature', type: 'note' });

    const result = executeStatus({ project: testDb.project });

    const mainWt = result.worktrees.find((w) => w.branch === 'main');
    const featureWt = result.worktrees.find((w) => w.branch === 'feature');

    expect(mainWt?.events.total).toBe(2);
    expect(featureWt?.events.total).toBe(1);
  });

  it('preserves legacy fields for backwards compatibility', () => {
    buildAgent(testDb.db);
    buildPlan(testDb.db);

    const result = executeStatus({ project: testDb.project });

    // Legacy fields should still exist
    expect(result.activeAgents).toBeDefined();
    expect(result.plans).toBeDefined();
    expect(Array.isArray(result.activeAgents)).toBe(true);
    expect(Array.isArray(result.plans)).toBe(true);
  });
});
