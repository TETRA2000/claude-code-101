import { describe, expect, it } from 'vitest';
import { content } from './index';
import { validateContent } from './validate';
import type { ApproveItem, ChainItem, ChoiceItem, HiddenItem } from './types';

describe('content', () => {
  it('is valid', () => {
    expect(validateContent(content)).toEqual([]);
  });

  it('lists all 13 units in course order', () => {
    expect(content.units.map((u) => u.key)).toEqual([
      'computer',
      'agent',
      'permissions',
      'injection',
      'browser',
      'powers',
      'mcp',
      'extensions',
      'installing',
      'sandboxes',
      'lockdown',
      'automode',
      'boss',
    ]);
  });

  it('wave 2 and new units are soon', () => {
    for (const key of ['extensions', 'automode', 'powers', 'mcp', 'installing', 'sandboxes', 'lockdown', 'boss']) {
      expect(content.unitByKey(key)?.status, key).toBe('soon');
    }
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

  it('has 4–7 cards and 10–14 items, and teaches where Claude Code keeps its files', () => {
    const body = content.bodyOf('computer');
    const nc = body?.cards.length ?? 0;
    const ni = body?.items.length ?? 0;
    expect(nc).toBeGreaterThanOrEqual(4);
    expect(nc).toBeLessThanOrEqual(7);
    expect(ni).toBeGreaterThanOrEqual(10);
    expect(ni).toBeLessThanOrEqual(14);
    const pairs = (body?.items ?? []).filter((it) => it.type === 'pairs');
    expect(pairs.some((it) => it.items.some((p) => p.left.en.includes('~/.claude/projects')))).toBe(true);
    const transcriptDemo = body?.cards.some(
      (c) =>
        c.demo?.kind === 'terminal' &&
        c.demo.commands.some(
          (cmd) => cmd.cmd.includes('~/.claude/projects') && cmd.output.some((o) => o.text.includes('.jsonl')),
        ),
    );
    expect(transcriptDemo).toBe(true);
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

  it('has 4–7 cards and 10–14 items, a Try it card, and at least two predict items', () => {
    const body = content.bodyOf('agent');
    const nc = body?.cards.length ?? 0;
    const ni = body?.items.length ?? 0;
    expect(nc).toBeGreaterThanOrEqual(4);
    expect(nc).toBeLessThanOrEqual(7);
    expect(ni).toBeGreaterThanOrEqual(10);
    expect(ni).toBeLessThanOrEqual(14);
    expect(body?.cards.some((c) => c.try)).toBe(true);
    expect(body?.cards.some((c) => c.deep)).toBe(true);
    expect((body?.items ?? []).filter((it) => it.type === 'predict').length).toBeGreaterThanOrEqual(2);
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

  it('has 6–7 cards and 12–14 items, a modes demo, two Try it cards, and a one-time-only prompt', () => {
    const body = content.bodyOf('permissions');
    const nc = body?.cards.length ?? 0;
    const ni = body?.items.length ?? 0;
    expect(nc).toBeGreaterThanOrEqual(6);
    expect(nc).toBeLessThanOrEqual(7);
    expect(ni).toBeGreaterThanOrEqual(12);
    expect(ni).toBeLessThanOrEqual(14);
    expect(body?.cards.some((c) => c.demo?.kind === 'modes')).toBe(true);
    expect(body?.cards.some((c) => c.demo?.kind === 'anatomy')).toBe(true);
    const tries = (body?.cards ?? []).filter((c) => c.try);
    expect(tries.length).toBeGreaterThanOrEqual(2);
    expect(tries.some((c) => c.try?.terminal.some((s) => s.code?.includes('"defaultMode": "manual"') && s.copy))).toBe(true);
    expect(tries.some((c) => c.try?.terminal.some((s) => s.code === '/permissions'))).toBe(true);
    const approves = (body?.items ?? []).filter((it): it is ApproveItem => it.type === 'approve');
    expect(approves.some((it) => it.choices?.join() === 'yes,no')).toBe(true);
    expect(approves.some((it) => /\.zshrc|\.mcp\.json/.test(it.target))).toBe(true);
    expect(body?.items.some((it) => it.type === 'decode')).toBe(true);
    expect(body?.items.some((it) => it.type === 'setup')).toBe(true);
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

  it('has 5–7 cards and 11–14 items, the context demo, and a Try it card for /memory', () => {
    const body = content.bodyOf('injection');
    const nc = body?.cards.length ?? 0;
    const ni = body?.items.length ?? 0;
    expect(nc).toBeGreaterThanOrEqual(5);
    expect(nc).toBeLessThanOrEqual(7);
    expect(ni).toBeGreaterThanOrEqual(11);
    expect(ni).toBeLessThanOrEqual(14);
    expect(body?.cards.some((c) => c.demo?.kind === 'context')).toBe(true);
    expect(body?.cards.some((c) => c.try?.terminal.some((s) => s.code === '/memory'))).toBe(true);
    const hidden = (body?.items ?? []).filter((it): it is HiddenItem => it.type === 'hidden');
    expect(hidden.some((it) => it.location.startsWith('mcp__'))).toBe(true);
  });
});

describe('unit 5: browser', () => {
  const SCENARIOS: Record<string, string[]> = {
    takeover: ['browser-chain-1'],
    cookieDump: ['browser-approve-1'],
    uploadTrap: ['browser-approve-2', 'browser-combo-2'],
    networkLog: ['browser-approve-3'],
    clickingYes: ['browser-chain-2'],
    screenshotSpill: ['browser-predict-1'],
    hiddenText: ['browser-hidden-1'],
    markdownImage: ['browser-hidden-1'],
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

  it('has 6–7 cards and 12–14 items, separate Chrome and Browser pane cards, a computer use card, and both prompt kinds', () => {
    const body = content.bodyOf('browser');
    const cards = body?.cards ?? [];
    const items = body?.items ?? [];
    expect(cards.length).toBeGreaterThanOrEqual(6);
    expect(cards.length).toBeLessThanOrEqual(7);
    expect(items.length).toBeGreaterThanOrEqual(12);
    expect(items.length).toBeLessThanOrEqual(14);
    const chromeCard = cards.find((c) => c.title.en.includes('Claude in Chrome'));
    const paneCard = cards.find((c) => c.title.en.includes('Browser pane'));
    expect(chromeCard).toBeDefined();
    expect(paneCard).toBeDefined();
    expect(chromeCard?.id).not.toBe(paneCard?.id);
    expect(cards.some((c) => c.title.en.toLowerCase().includes('computer use'))).toBe(true);
    const approves = items.filter((it): it is ApproveItem => it.type === 'approve');
    expect(approves.some((it) => it.pane === 'browser')).toBe(true);
    expect(approves.some((it) => it.surface === 'terminal')).toBe(true);
    const setups = items.filter((it): it is ChoiceItem => it.type === 'setup');
    expect(
      setups.some(
        (it) => it.opts.some((o) => o.text.en.includes('Claude in Chrome')) && it.opts.some((o) => o.text.en.includes('Browser pane')),
      ),
    ).toBe(true);
  });

  it('never makes a credential-named file an upload target (the Chrome guard already refuses those)', () => {
    const items = content.bodyOf('browser')?.items ?? [];
    const guarded = /\.env\b|id_rsa|\.pem\b|\.key\b|\.ssh\//;
    const isUpload = (tool: string, target: string) => /upload/i.test(tool) || target.includes('←');
    const targets = items.flatMap((it) => {
      if (it.type === 'approve') return isUpload(it.tool, it.target) ? [it.target] : [];
      if (it.type === 'chain') return it.steps.filter((s) => isUpload(s.tool, s.target)).map((s) => s.target);
      return [];
    });
    expect(targets.length).toBeGreaterThan(0);
    for (const t of targets) expect(t, t).not.toMatch(guarded);
  });
});
