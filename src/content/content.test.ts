import { describe, expect, it } from 'vitest';
import { content } from './index';
import { validateContent } from './validate';
import type { ApproveItem } from './types';

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

describe('unit 1: computer', () => {
  it('is ready, practices predict/decode/pairs only, and demos the terminal', () => {
    expect(content.unitByKey('computer')?.status).toBe('ready');
    const body = content.bodyOf('computer');
    expect(body).toBeDefined();
    const types = new Set(body?.items.map((it) => it.type));
    expect([...types].every((ty) => ['predict', 'decode', 'pairs'].includes(ty))).toBe(true);
    expect(body?.cards.some((c) => c.demo?.kind === 'terminal')).toBe(true);
  });
});

describe('unit 2: agent', () => {
  it('is ready, demos the context window, and has an order item', () => {
    expect(content.unitByKey('agent')?.status).toBe('ready');
    const body = content.bodyOf('agent');
    expect(body).toBeDefined();
    expect(body?.cards.some((c) => c.demo?.kind === 'context')).toBe(true);
    expect(body?.items.some((it) => it.type === 'order')).toBe(true);
  });
});

describe('unit 3: permissions', () => {
  it('is ready, mixes surfaces, and grades approve items per the spec', () => {
    expect(content.unitByKey('permissions')?.status).toBe('ready');
    const body = content.bodyOf('permissions');
    expect(body).toBeDefined();
    const approves = (body?.items ?? []).filter((it): it is ApproveItem => it.type === 'approve');
    expect(approves.length).toBeGreaterThan(0);
    const share = approves.filter((it) => it.accept.includes('yes')).length / approves.length;
    expect(share).toBeGreaterThanOrEqual(0.5);
    expect(share).toBeLessThanOrEqual(0.7);
    expect(approves.filter((it) => it.surface === 'desktop').length).toBeGreaterThanOrEqual(3);
    expect(approves.filter((it) => it.surface === 'terminal').length).toBeGreaterThanOrEqual(3);
    expect(approves.some((it) => it.accept.join() === 'yes,always')).toBe(true);
    expect(approves.some((it) => it.accept.join() === 'yes')).toBe(true);
  });
});
