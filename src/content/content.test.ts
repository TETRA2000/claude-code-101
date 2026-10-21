import { describe, expect, it } from 'vitest';
import { content } from './index';
import { validateContent } from './validate';

describe('content', () => {
  it('is valid', () => {
    expect(validateContent(content)).toEqual([]);
  });

  it('lists all 11 units in course order', () => {
    expect(content.units.map((u) => u.key)).toEqual([
      'computer',
      'agent',
      'permissions',
      'injection',
      'browser',
      'powers',
      'mcp',
      'installing',
      'sandboxes',
      'lockdown',
      'boss',
    ]);
  });
});
