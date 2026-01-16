import { describe, it, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import { createTestDb, cleanupAllTestDbs, type TestDb } from '../test/setup';
import { buildAgent, buildPlan, buildTask, buildEvent } from '../test/factories';
import { emit } from './emit';
import { getEventsSince } from './getEventsSince';
import { getEventsByPlan } from './getEventsByPlan';
import { getEventsByAgent } from './getEventsByAgent';
import { getRecentEvents } from './getRecentEvents';

describe('Events Module', () => {
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

  describe('emit', () => {
    it('creates a new event', () => {
      const { agent } = buildAgent(testDb.db, { label: 'test' });

      const event = emit(testDb.db, {
        agent_id: agent.id,
        type: 'note',
        content: 'Test note',
      });

      expect(event.id).toMatch(/^evt_[a-f0-9]{6}_\d+$/);
      expect(event.agent_id).toBe(agent.id);
      expect(event.event_type).toBe('note');
      expect(event.content).toBe('Test note');
      expect(event.timestamp).toBeDefined();
    });

    it('creates event with plan and task', () => {
      const { task, plan, agent } = buildTask(testDb.db);

      const event = emit(testDb.db, {
        agent_id: agent.id,
        plan_id: plan.id,
        task_id: task.id,
        type: 'task:start',
        content: 'Starting task',
      });

      expect(event.plan_id).toBe(plan.id);
      expect(event.task_id).toBe(task.id);
    });

    it('creates event with branch and worktree', () => {
      const { agent } = buildAgent(testDb.db);

      const event = emit(testDb.db, {
        agent_id: agent.id,
        branch: 'feature/auth',
        type: 'context',
        content: 'Working on auth',
      });

      expect(event.branch).toBe('feature/auth');
    });

    it('stores metadata as JSON', () => {
      const { agent } = buildAgent(testDb.db);

      const event = emit(testDb.db, {
        agent_id: agent.id,
        type: 'decision',
        content: 'Chose option A',
        metadata: { reason: 'simpler', alternatives: ['B', 'C'] },
      });

      expect(event.metadata).toBe('{"reason":"simpler","alternatives":["B","C"]}');
      expect(JSON.parse(event.metadata!)).toEqual({ reason: 'simpler', alternatives: ['B', 'C'] });
    });

    it('increments sequence for same hex', () => {
      const { agent } = buildAgent(testDb.db);

      const event1 = emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'First' });
      const event2 = emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'Second' });

      const seq1 = parseInt(event1.id.split('_')[2]);
      const seq2 = parseInt(event2.id.split('_')[2]);
      expect(seq2).toBe(seq1 + 1);
    });
  });

  describe('getEventsSince', () => {
    it('returns events after sequence number', () => {
      const { agent } = buildAgent(testDb.db);

      const event1 = emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'First' });
      emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'Second' });

      const events = getEventsSince(testDb.db, event1.seq);

      expect(events).toHaveLength(1);
      expect(events[0].content).toBe('Second');
    });

    it('returns events after timestamp', () => {
      const { agent } = buildAgent(testDb.db);

      emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'First' });
      emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'Second' });

      const events = getEventsSince(testDb.db, '2020/01/01 00:00:00 UTC');

      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    it('returns empty array when no events after sequence', () => {
      const { agent } = buildAgent(testDb.db);

      const event = emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'Only event' });

      const events = getEventsSince(testDb.db, event.seq);
      expect(events).toHaveLength(0);
    });

    it('returns empty array when no events after timestamp', () => {
      const { agent } = buildAgent(testDb.db);

      emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'Old event' });

      const events = getEventsSince(testDb.db, '2099/01/01 00:00:00 UTC');
      expect(events).toHaveLength(0);
    });
  });

  describe('getEventsByPlan', () => {
    it('returns events for specific plan', () => {
      const { plan, agent } = buildPlan(testDb.db);

      emit(testDb.db, { agent_id: agent.id, plan_id: plan.id, type: 'plan:create', content: 'Created' });
      emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'Unrelated' });

      const events = getEventsByPlan(testDb.db, plan.id);

      expect(events).toHaveLength(1);
      expect(events[0].plan_id).toBe(plan.id);
    });
  });

  describe('getEventsByAgent', () => {
    it('returns events for specific agent', () => {
      const { agent: agent1 } = buildAgent(testDb.db, { label: 'one' });
      const { agent: agent2 } = buildAgent(testDb.db, { label: 'two' });

      emit(testDb.db, { agent_id: agent1.id, type: 'note', content: 'Agent 1 event' });
      emit(testDb.db, { agent_id: agent2.id, type: 'note', content: 'Agent 2 event' });

      const events = getEventsByAgent(testDb.db, agent1.id);

      expect(events).toHaveLength(1);
      expect(events[0].agent_id).toBe(agent1.id);
    });
  });

  describe('getRecentEvents', () => {
    it('returns limited recent events', () => {
      const { agent } = buildAgent(testDb.db);

      for (let i = 0; i < 10; i++) {
        emit(testDb.db, { agent_id: agent.id, type: 'note', content: `Event ${i}` });
      }

      const events = getRecentEvents(testDb.db, 5);

      expect(events).toHaveLength(5);
    });

    it('returns events in chronological order (oldest first)', () => {
      const { agent } = buildAgent(testDb.db);

      emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'First' });
      emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'Second' });
      emit(testDb.db, { agent_id: agent.id, type: 'note', content: 'Third' });

      const events = getRecentEvents(testDb.db, 3);

      expect(events[0].content).toBe('First');
      expect(events[2].content).toBe('Third');
    });
  });
});
