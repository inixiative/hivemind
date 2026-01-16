import { describe, it, expect } from 'bun:test';
import { formatDate } from './formatDate';
import { formatTime } from './formatTime';
import { formatDatetime } from './formatDatetime';
import { now } from './now';
import { parseDatetime } from './parseDatetime';
import { isStale } from './isStale';

describe('formatDate', () => {
  it('formats date as yyyy/mm/dd', () => {
    const date = new Date('2024-03-15T10:30:00Z');
    const formatted = formatDate(date);
    expect(formatted).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
  });
});

describe('formatTime', () => {
  it('formats time as hh:mm:ss', () => {
    const date = new Date('2024-03-15T10:30:45Z');
    const formatted = formatTime(date);
    expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

describe('formatDatetime', () => {
  it('formats datetime with timezone', () => {
    const date = new Date('2024-03-15T10:30:45Z');
    const formatted = formatDatetime(date);
    expect(formatted).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} [A-Z]{2,4}$/);
  });
});

describe('now', () => {
  it('returns current datetime string', () => {
    const current = now();
    expect(current).toMatch(/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} [A-Z]{2,4}$/);
  });
});

describe('parseDatetime', () => {
  it('parses formatted datetime string', () => {
    const original = new Date();
    const formatted = formatDatetime(original);
    const parsed = parseDatetime(formatted);

    expect(parsed).toBeInstanceOf(Date);
    // Allow 1 second tolerance due to milliseconds being lost
    expect(Math.abs(parsed!.getTime() - original.getTime())).toBeLessThan(1000);
  });

  it('returns null for invalid string', () => {
    expect(parseDatetime('invalid')).toBeNull();
    expect(parseDatetime('')).toBeNull();
  });
});

describe('isStale', () => {
  it('returns true for old timestamps', () => {
    const oldDate = new Date(Date.now() - 120000); // 2 minutes ago
    const formatted = formatDatetime(oldDate);
    expect(isStale(formatted, 60000)).toBe(true); // 1 minute threshold
  });

  it('returns false for recent timestamps', () => {
    const recent = now();
    expect(isStale(recent, 60000)).toBe(false);
  });

  it('returns true for null/undefined', () => {
    expect(isStale(null, 60000)).toBe(true);
    expect(isStale(undefined, 60000)).toBe(true);
  });
});
