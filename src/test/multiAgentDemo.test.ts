import { describe, it, expect } from 'bun:test';
import { greeting, farewell } from './multiAgentDemo';

describe('Multi-Agent Demo', () => {
  it('greeting returns correct message', () => {
    expect(greeting()).toBe('Hello from Agent 1');
  });

  it('farewell returns correct message', () => {
    expect(farewell()).toBe('Goodbye from Agent 2');
  });

  it('both functions work together', () => {
    const conversation = `${greeting()} ... ${farewell()}`;
    expect(conversation).toBe('Hello from Agent 1 ... Goodbye from Agent 2');
  });
});
