import { describe, expect, it } from 'vitest';
import { content } from './index';
import { validateContent } from './validate';
import type { ApproveItem, ChainItem, HiddenItem } from './types';

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

describe('unit 4: injection', () => {
  it('is ready, hides orders in 5+ sources with 3+ methods, and has terminal chains and approve items', () => {
    expect(content.unitByKey('injection')?.status).toBe('ready');
    const items = content.bodyOf('injection')?.items ?? [];
    const hidden = items.filter((it): it is HiddenItem => it.type === 'hidden');
    expect(new Set(hidden.map((it) => it.source)).size).toBeGreaterThanOrEqual(5);
    const methods = new Set(hidden.flatMap((it) => it.lines.flatMap((l) => (l.hidden ? [l.hidden] : []))));
    expect(methods.size).toBeGreaterThanOrEqual(3);
    const chains = items.filter((it): it is ChainItem => it.type === 'chain');
    expect(chains.length).toBeGreaterThanOrEqual(2);
    expect(chains.every((it) => it.scene.kind === 'terminal')).toBe(true);
    expect(chains.some((it) => it.steps.at(-1)?.target.endsWith('CLAUDE.md'))).toBe(true);
    expect(items.filter((it) => it.type === 'approve').length).toBeGreaterThanOrEqual(2);
  });
});

describe('unit 5: browser', () => {
  const SCENARIOS: Record<string, string[]> = {
    takeover: ['browser-chain-1'],
    cookieDump: ['browser-approve-1'],
    uploadTrap: ['browser-approve-2'],
    networkLog: ['browser-approve-3'],
    clickingYes: ['browser-chain-2'],
    screenshotSpill: ['browser-predict-1'],
    hiddenText: ['browser-hidden-1'],
    markdownImage: ['browser-hidden-2'],
  };

  it('is ready, has browser chains, combos and setups, and covers every scenario', () => {
    expect(content.unitByKey('browser')?.status).toBe('ready');
    const items = content.bodyOf('browser')?.items ?? [];
    const chains = items.filter((it): it is ChainItem => it.type === 'chain');
    expect(chains.filter((it) => it.scene.kind === 'browser').length).toBeGreaterThanOrEqual(2);
    expect(items.filter((it) => it.type === 'combo').length).toBeGreaterThanOrEqual(2);
    expect(items.filter((it) => it.type === 'setup').length).toBeGreaterThanOrEqual(1);
    const ids = new Set(items.map((it) => it.id));
    for (const [scenario, list] of Object.entries(SCENARIOS)) {
      expect(list.length, scenario).toBeGreaterThan(0);
      for (const id of list) expect(ids.has(id), `${scenario}: ${id}`).toBe(true);
    }
    const hiddenText = items.find((it) => it.id === 'browser-hidden-1') as HiddenItem | undefined;
    expect(hiddenText?.source).toBe('web');
  });
});
