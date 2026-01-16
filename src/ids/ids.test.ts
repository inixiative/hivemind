import { describe, it, expect } from 'bun:test';
import { generateHex } from './generateHex';
import { makeAgentId } from './makeAgentId';
import { makePlanId } from './makePlanId';
import { makeTaskId } from './makeTaskId';
import { makeEventId } from './makeEventId';
import { makeWorktreeId } from './makeWorktreeId';
import { makeSubtaskId } from './makeSubtaskId';
import { parseId } from './parseId';
import { isValidId } from './isValidId';
import { sanitizeLabel } from './sanitizeLabel';
import { getPlanHexFromTaskId } from './getPlanHexFromTaskId';
import { isSubtask } from './isSubtask';
import { getParentTaskId } from './getParentTaskId';
import { isAgentId, isPlanId, isTaskId, isEventId, isWorktreeId, taskId } from './typedIds';

describe('generateHex', () => {
  it('generates 6 character hex strings', () => {
    const hex = generateHex();
    expect(hex).toHaveLength(6);
    expect(hex).toMatch(/^[a-f0-9]{6}$/);
  });

  it('generates unique values', () => {
    const hexes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      hexes.add(generateHex());
    }
    expect(hexes.size).toBe(100);
  });
});

describe('makeAgentId', () => {
  it('creates agent id without label', () => {
    const id = makeAgentId();
    expect(id).toMatch(/^agt_[a-f0-9]{6}$/);
    expect(isAgentId(id)).toBe(true);
  });

  it('creates agent id with label', () => {
    const id = makeAgentId('main');
    expect(id).toMatch(/^agt_[a-f0-9]{6}_main$/);
  });

  it('sanitizes label (removes non-alphanumeric)', () => {
    const id = makeAgentId('My Agent!');
    expect(id).toMatch(/^agt_[a-f0-9]{6}_myagent$/);
  });
});

describe('makePlanId', () => {
  it('creates plan id and returns hex', () => {
    const { id, hex } = makePlanId();
    expect(id).toMatch(/^pln_[a-f0-9]{6}$/);
    expect(hex).toMatch(/^[a-f0-9]{6}$/);
    expect(isPlanId(id)).toBe(true);
  });

  it('creates plan id with label', () => {
    const { id } = makePlanId('auth-feature');
    expect(id).toMatch(/^pln_[a-f0-9]{6}_authfeature$/);
  });
});

describe('makeTaskId', () => {
  it('creates task id with plan hex and sequence (3-digit padded)', () => {
    const id = makeTaskId('abc123', 1);
    expect(id).toBe(taskId('tsk_abc123_001'));
    expect(isTaskId(id)).toBe(true);
  });

  it('creates task id with label', () => {
    const id = makeTaskId('abc123', 1, 'setup');
    expect(id).toBe(taskId('tsk_abc123_001_setup'));
  });

  it('pads sequence correctly', () => {
    expect(makeTaskId('abc123', 1)).toBe(taskId('tsk_abc123_001'));
    expect(makeTaskId('abc123', 10)).toBe(taskId('tsk_abc123_010'));
    expect(makeTaskId('abc123', 100)).toBe(taskId('tsk_abc123_100'));
  });
});

describe('makeSubtaskId', () => {
  it('creates subtask id from parent task', () => {
    const parentId = taskId('tsk_abc123_001');
    const id = makeSubtaskId(parentId, 1);
    expect(id).toBe(taskId('tsk_abc123_001.1'));
  });

  it('creates subtask id with label', () => {
    const parentId = taskId('tsk_abc123_001');
    const id = makeSubtaskId(parentId, 2, 'validate');
    expect(id).toBe(taskId('tsk_abc123_001.2_validate'));
  });
});

describe('makeEventId', () => {
  it('creates event id with hex and sequence (5-digit padded)', () => {
    const { id, hex } = makeEventId(1);
    expect(id).toMatch(/^evt_[a-f0-9]{6}_00001$/);
    expect(hex).toMatch(/^[a-f0-9]{6}$/);
    expect(isEventId(id)).toBe(true);
  });
});

describe('makeWorktreeId', () => {
  it('creates worktree id without label', () => {
    const id = makeWorktreeId();
    expect(id).toMatch(/^wkt_[a-f0-9]{6}$/);
    expect(isWorktreeId(id)).toBe(true);
  });

  it('creates worktree id with label', () => {
    const id = makeWorktreeId('feature-auth');
    expect(id).toMatch(/^wkt_[a-f0-9]{6}_featureauth$/);
  });
});

describe('parseId', () => {
  it('parses agent id without label', () => {
    const parsed = parseId('agt_abc123');
    expect(parsed.type).toBe('agt');
    expect(parsed.hex).toBe('abc123');
    expect(parsed.label).toBeUndefined();
  });

  it('parses agent id with label', () => {
    const parsed = parseId('agt_abc123_main');
    expect(parsed.type).toBe('agt');
    expect(parsed.hex).toBe('abc123');
    expect(parsed.label).toBe('main');
  });

  it('parses task id', () => {
    const parsed = parseId('tsk_abc123_001');
    expect(parsed.type).toBe('tsk');
    expect(parsed.hex).toBe('abc123');
    expect(parsed.seq).toBe('001');
  });

  it('parses task id with label', () => {
    const parsed = parseId('tsk_abc123_001_setup');
    expect(parsed.type).toBe('tsk');
    expect(parsed.hex).toBe('abc123');
    expect(parsed.seq).toBe('001');
    expect(parsed.label).toBe('setup');
  });

  it('parses subtask id (seq includes dot notation)', () => {
    const parsed = parseId('tsk_abc123_001.2');
    expect(parsed.type).toBe('tsk');
    expect(parsed.hex).toBe('abc123');
    expect(parsed.seq).toBe('001.2');
  });

  it('parses event id', () => {
    const parsed = parseId('evt_abc123_00005');
    expect(parsed.type).toBe('evt');
    expect(parsed.hex).toBe('abc123');
    expect(parsed.seq).toBe('00005');
  });
});

describe('isValidId', () => {
  it('validates correct ids', () => {
    expect(isValidId('agt_abc123')).toBe(true);
    expect(isValidId('agt_abc123_main')).toBe(true);
    expect(isValidId('pln_abc123')).toBe(true);
    expect(isValidId('tsk_abc123_001')).toBe(true);
    expect(isValidId('evt_abc123_00001')).toBe(true);
    expect(isValidId('wkt_abc123')).toBe(true);
  });

  it('rejects invalid ids', () => {
    expect(isValidId('invalid')).toBe(false);
    expect(isValidId('agt_')).toBe(false);
    expect(isValidId('xxx_abc123')).toBe(false);
    expect(isValidId('')).toBe(false);
    expect(isValidId('agt_ABC123')).toBe(false); // uppercase hex invalid
  });
});

describe('sanitizeLabel', () => {
  it('lowercases', () => {
    expect(sanitizeLabel('MyLabel')).toBe('mylabel');
  });

  it('removes non-alphanumeric characters', () => {
    expect(sanitizeLabel('test-label')).toBe('testlabel');
    expect(sanitizeLabel('Test Label!')).toBe('testlabel');
    expect(sanitizeLabel('test_123')).toBe('test123');
  });

  it('truncates long labels to 20 chars', () => {
    const long = 'a'.repeat(30);
    expect(sanitizeLabel(long)).toHaveLength(20);
  });

  it('handles empty string', () => {
    expect(sanitizeLabel('')).toBe('');
  });
});

describe('getPlanHexFromTaskId', () => {
  it('extracts plan hex from task id', () => {
    expect(getPlanHexFromTaskId('tsk_abc123_001')).toBe('abc123');
    expect(getPlanHexFromTaskId('tsk_abc123_001_label')).toBe('abc123');
  });
});

describe('isSubtask', () => {
  it('identifies subtasks (contains dot in seq)', () => {
    expect(isSubtask('tsk_abc123_001.1')).toBe(true);
    expect(isSubtask('tsk_abc123_001.2_label')).toBe(true);
  });

  it('identifies non-subtasks', () => {
    expect(isSubtask('tsk_abc123_001')).toBe(false);
    expect(isSubtask('tsk_abc123_001_label')).toBe(false);
  });
});

describe('getParentTaskId', () => {
  it('gets parent task id from subtask', () => {
    expect(getParentTaskId('tsk_abc123_001.2')).toBe('tsk_abc123_001');
    expect(getParentTaskId('tsk_abc123_001.2_label')).toBe('tsk_abc123_001');
  });

  it('returns null for non-subtask', () => {
    expect(getParentTaskId('tsk_abc123_001')).toBeNull();
  });
});

describe('typed id guards', () => {
  it('correctly identifies id types', () => {
    expect(isAgentId('agt_abc123')).toBe(true);
    expect(isAgentId('pln_abc123')).toBe(false);

    expect(isPlanId('pln_abc123')).toBe(true);
    expect(isPlanId('agt_abc123')).toBe(false);

    expect(isTaskId('tsk_abc123_001')).toBe(true);
    expect(isTaskId('pln_abc123')).toBe(false);

    expect(isEventId('evt_abc123_00001')).toBe(true);
    expect(isEventId('tsk_abc123_001')).toBe(false);

    expect(isWorktreeId('wkt_abc123')).toBe(true);
    expect(isWorktreeId('agt_abc123')).toBe(false);
  });
});
