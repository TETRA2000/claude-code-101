import { describe, expect, it } from 'vitest';
import type { Item } from '../content/types';
import { fixtureContent } from '../test/fixtures';
import { accuracy, currentItem, sessionReducer, startSession, type SessionAction } from './session';
import type { Session } from './types';

const items = fixtureContent.bodyOf('demo')!.items;
const get = (type: Item['type']) => items.find((i) => i.type === type)!;
const run = (s: Session, ...actions: SessionAction[]) => actions.reduce(sessionReducer, s);
const sel = (n: number): SessionAction[] => [{ type: 'select', sel: n }, { type: 'check' }];
const next: SessionAction = { type: 'next' };
// predict (answer 1) twice under different ids is not needed: use predict + setup + chain
const three = () => startSession('demo', [get('predict'), get('setup'), get('chain')]); // answers 1, 0, 1

describe('startSession', () => {
  it('starts with 5 hearts on the first item', () => {
    const s = three();
    expect(s).toMatchObject({ idx: 0, total: 3, hearts: 5, xp: 0, solved: 0, phase: 'question' });
    expect(currentItem(s)?.id).toBe('demo-predict');
  });
  it('finishes immediately with no items', () => {
    expect(startSession('demo', []).phase).toBe('done');
  });
});

describe('grading', () => {
  it('awards 10 XP for a first-try answer', () => {
    const s = run(three(), ...sel(1));
    expect(s).toMatchObject({ solved: 1, firstTry: 1, xp: 10, hearts: 5 });
    expect(s.answer).toMatchObject({ checked: true, ok: true });
  });

  it('costs a heart and re-queues a wrong answer at the end', () => {
    const s = run(three(), ...sel(0));
    expect(s).toMatchObject({ hearts: 4, solved: 0, xp: 0 });
    expect(s.queue).toEqual(['demo-predict', 'demo-setup', 'demo-chain', 'demo-predict']);
    expect(s.missed).toEqual({ 'demo-predict': true });
  });

  it('awards 5 XP for a missed item answered later', () => {
    const s = run(three(), ...sel(0), next, ...sel(0), next, ...sel(1), next, ...sel(1));
    expect(s).toMatchObject({ solved: 3, firstTry: 2, xp: 25, hearts: 4 });
    expect(accuracy(s)).toBe(67);
  });

  it('ignores a second check on the same item', () => {
    const s = run(three(), ...sel(0), { type: 'check' }, { type: 'select', sel: 1 }, { type: 'check' });
    expect(s.hearts).toBe(4);
    expect(s.queue).toHaveLength(4);
    expect(s.answer.sel).toBe(0);
  });

  it('ignores check with nothing selected', () => {
    expect(run(three(), { type: 'check' }).answer.checked).toBe(false);
  });
});

describe('next', () => {
  it('does nothing before the answer is checked', () => {
    expect(run(three(), next).idx).toBe(0);
  });
  it('moves on with a fresh answer', () => {
    const s = run(three(), ...sel(1), next);
    expect(s.idx).toBe(1);
    expect(s.answer).toMatchObject({ sel: null, checked: false });
  });
  it('finishes when the queue is exhausted', () => {
    const s = run(three(), ...sel(1), next, ...sel(0), next, ...sel(1), next);
    expect(s.phase).toBe('done');
    expect(s).toMatchObject({ xp: 30, firstTry: 3, hearts: 5 });
    expect(accuracy(s)).toBe(100);
  });
  it('ends the run at 0 hearts even with items left', () => {
    let s = startSession('demo', [get('predict')], 1);
    s = run(s, ...sel(0));
    expect(s.hearts).toBe(0);
    expect(run(s, next).phase).toBe('out');
  });
});

describe('hints', () => {
  const appr = () => startSession('demo', [get('approve')]); // accept yes/always
  const hinted = (s: Session) => run(s, { type: 'useHint' });

  it('first try with a hint gives 5 XP', () => {
    const s = run(hinted(appr()), ...sel(0));
    expect(s.xp).toBe(5);
    expect(s.answer.hintUsed).toBe(true);
  });

  it('a retry with a hint gives 0, never negative, and the hint persists across re-queue', () => {
    let s = run(hinted(appr()), ...sel(2), next); // wrong -> requeued
    expect(s.answer.hintUsed).toBe(true);
    s = run(s, ...sel(0));
    expect(s.xp).toBe(0);
    expect(s.solved).toBe(1);
  });

  it('is ignored on an item without decode', () => {
    const s = run(startSession('demo', [get('predict')]), { type: 'useHint' });
    expect(s.answer.hintUsed).toBe(false);
    expect(s.hinted).toEqual({});
  });

  it('is ignored after check', () => {
    const s = run(appr(), ...sel(0), { type: 'useHint' });
    expect(s.answer.hintUsed).toBe(false);
  });
});

describe('auto-graded pairs and decode', () => {
  it('pairs finish when all matched, with no heart cost on mismatches', () => {
    const p = get('pairs') as Extract<Item, { type: 'pairs' }>;
    let s = startSession('demo', [p]);
    s = run(s, { type: 'pickPair', side: 'left', id: p.items[0]!.id }, { type: 'pickPair', side: 'right', id: p.items[1]!.id });
    expect(s.answer).toMatchObject({ miss: { left: p.items[0]!.id, right: p.items[1]!.id }, misses: 1, left: null, right: null });
    expect(s.hearts).toBe(5);
    s = run(s, { type: 'clearMiss' });
    expect(s.answer.miss).toBeNull();
    for (const it of p.items) s = run(s, { type: 'pickPair', side: 'right', id: it.id }, { type: 'pickPair', side: 'left', id: it.id });
    expect(s.answer).toMatchObject({ checked: true, ok: true });
    expect(s).toMatchObject({ hearts: 5, xp: 10, solved: 1 });
  });

  it('decode finishes the same way', () => {
    const d = get('decode') as Extract<Item, { type: 'decode' }>;
    let s = startSession('demo', [d]);
    for (const part of d.parts) s = run(s, { type: 'pickPair', side: 'left', id: part.id }, { type: 'pickPair', side: 'right', id: part.id });
    expect(s.answer).toMatchObject({ checked: true, ok: true });
    expect(s.hearts).toBe(5);
  });

  it('select is ignored on auto-graded items', () => {
    const s = run(startSession('demo', [get('pairs')]), { type: 'select', sel: 1 });
    expect(s.answer.sel).toBeNull();
  });
});

describe('move and togglePick', () => {
  it('move reorders the order answer', () => {
    const o = get('order') as Extract<Item, { type: 'order' }>;
    const s = run(startSession('demo', [o]), { type: 'move', from: 0, to: 2 });
    expect(s.answer.order).toEqual(['ask', 'tool', 'result']);
  });
  it('move is ignored after check and for non-order items', () => {
    const o = get('order') as Extract<Item, { type: 'order' }>;
    const checked = run(startSession('demo', [o]), { type: 'check' });
    expect(checked.answer.checked).toBe(true);
    expect(run(checked, { type: 'move', from: 0, to: 2 }).answer.order).toEqual(o.start);
    const p = run(startSession('demo', [get('predict')]), { type: 'move', from: 0, to: 1 });
    expect(p.answer.order).toEqual([]);
  });
  it('togglePick adds then removes a line', () => {
    const h = startSession('demo', [get('hidden')]);
    const on = run(h, { type: 'togglePick', line: 2 });
    expect(on.answer.picked).toEqual([2]);
    expect(run(on, { type: 'togglePick', line: 2 }).answer.picked).toEqual([]);
  });
  it('togglePick also works on settings items, and they are graded by check', () => {
    const h = startSession('demo', [get('settings')]);
    const on = run(h, { type: 'togglePick', line: 2 });
    expect(on.answer.picked).toEqual([2]);
    expect(run(on, { type: 'check' }).answer.ok).toBe(true);
    expect(run(h, { type: 'togglePick', line: 1 }, { type: 'check' }).answer.ok).toBe(false);
  });
  it('togglePick is ignored on a precedence item', () => {
    expect(run(startSession('demo', [get('precedence')]), { type: 'togglePick', line: 0 }).answer.picked).toEqual([]);
  });
  it('the hidden item is graded by check', () => {
    const s = run(startSession('demo', [get('hidden')]), { type: 'togglePick', line: 2 }, { type: 'check' });
    expect(s.answer.ok).toBe(true);
  });
});

describe('start', () => {
  it('restarts the run', () => {
    const s = run(three(), ...sel(0), { type: 'start' });
    expect(s).toMatchObject({ hearts: 5, idx: 0, xp: 0, total: 3 });
    expect(s.queue).toHaveLength(3);
  });
});

describe('rule items', () => {
  const rule = () => startSession('demo', [get('rule')]); // answer: deny (list 2) + Bash(curl *) (sel 1)
  const pick = (list: number, sel: number): SessionAction[] => [{ type: 'selectList', list }, { type: 'select', sel }];

  it('starts with no list picked', () => {
    expect(rule().answer.list).toBeNull();
  });
  it('needs both a list and a pattern before check', () => {
    expect(run(rule(), { type: 'select', sel: 1 }, { type: 'check' }).answer.checked).toBe(false);
    expect(run(rule(), { type: 'selectList', list: 2 }, { type: 'check' }).answer.checked).toBe(false);
  });
  it('grades the chosen rule through outcomeOf', () => {
    const ok = run(rule(), ...pick(2, 1), { type: 'check' });
    expect(ok.answer).toMatchObject({ list: 2, sel: 1, checked: true, ok: true });
    expect(ok.xp).toBe(10);
    // deny Bash(curl) is exact: `curl https://example.com` still asks.
    expect(run(rule(), ...pick(2, 0), { type: 'check' }).answer.ok).toBe(false);
    // deny Bash(*) also blocks npm test.
    expect(run(rule(), ...pick(2, 2), { type: 'check' }).answer.ok).toBe(false);
    // allow Bash(curl *) lets curl run.
    expect(run(rule(), ...pick(0, 1), { type: 'check' }).answer.ok).toBe(false);
  });
  it('ignores selectList after check and on other items', () => {
    const s = run(rule(), ...pick(2, 1), { type: 'check' }, { type: 'selectList', list: 0 });
    expect(s.answer.list).toBe(2);
    expect(run(startSession('demo', [get('predict')]), { type: 'selectList', list: 0 }).answer.list).toBeNull();
  });
});
