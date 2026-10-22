import { describe, expect, it } from 'vitest';
import { createContent } from '../content';
import type { UnitMeta } from '../content/types';
import { fixtureContent, fixtureParts } from '../test/fixtures';
import type { Progress } from '../storage/progress';
import { appReducer, initState, suggestedUnit, type AppState } from './app';

const empty: Progress = { lang: null, learned: {}, practiced: {}, xp: 0 };
const demoUnit = fixtureContent.unitByKey('demo')!;
const demoBody = fixtureContent.bodyOf('demo')!;
const soon: UnitMeta = { ...demoUnit, key: 'later', status: 'soon' };
const second: UnitMeta = { ...demoUnit, key: 'second' };
const content = createContent(
  [...fixtureParts.units, soon, second],
  fixtureParts.types,
  { ...fixtureParts.bodies, second: demoBody },
);
const reduce = appReducer(content);
const home = (): AppState => initState(empty, ['en-US']);

describe('initState', () => {
  it('uses detectLang with the stored language and browser languages', () => {
    expect(initState(empty, ['ja-JP']).lang).toBe('ja');
    expect(initState({ ...empty, lang: 'en' }, ['ja-JP']).lang).toBe('en');
    expect(initState(empty, []).lang).toBe('en');
    expect(home().screen).toEqual({ name: 'home' });
  });
});

describe('appReducer', () => {
  it('ignores openLearn/openPractice on soon or unknown units', () => {
    const s = home();
    for (const unitKey of ['later', 'nope']) {
      expect(reduce(s, { type: 'openLearn', unitKey })).toBe(s);
      expect(reduce(s, { type: 'openPractice', unitKey })).toBe(s);
    }
  });
  it('opens learn at card 0 and practice for ready units', () => {
    expect(reduce(home(), { type: 'openLearn', unitKey: 'demo' }).screen).toEqual({ name: 'learn', unitKey: 'demo', card: 0 });
    expect(reduce(home(), { type: 'openPractice', unitKey: 'demo' }).screen).toEqual({ name: 'practice', unitKey: 'demo' });
  });
  it('gotoCard only applies on the learn screen and stays within the cards', () => {
    const h = home();
    expect(reduce(h, { type: 'gotoCard', card: 1 })).toBe(h);
    const l = reduce(h, { type: 'openLearn', unitKey: 'demo' });
    const n = fixtureContent.bodyOf('demo')!.cards.length;
    expect(reduce(l, { type: 'gotoCard', card: 1 }).screen).toMatchObject({ card: Math.min(1, n - 1) });
    expect(reduce(l, { type: 'gotoCard', card: -4 }).screen).toMatchObject({ card: 0 });
    expect(reduce(l, { type: 'gotoCard', card: 999 }).screen).toMatchObject({ card: n - 1 });
  });
  it('finishLearn marks learned and goes to practice or home', () => {
    const l = reduce(home(), { type: 'openLearn', unitKey: 'demo' });
    const a = reduce(l, { type: 'finishLearn', practice: true });
    expect(a.progress.learned).toEqual({ demo: true });
    expect(a.screen).toEqual({ name: 'practice', unitKey: 'demo' });
    const b = reduce(l, { type: 'finishLearn', practice: false });
    expect(b.progress.learned).toEqual({ demo: true });
    expect(b.screen).toEqual({ name: 'home' });
    const h = home();
    expect(reduce(h, { type: 'finishLearn', practice: true })).toBe(h);
  });
  it('completePractice adds xp and marks practiced', () => {
    const s = reduce(reduce(home(), { type: 'completePractice', unitKey: 'demo', xp: 30 }), {
      type: 'completePractice',
      unitKey: 'second',
      xp: 20,
    });
    expect(s.progress.xp).toBe(50);
    expect(s.progress.practiced).toEqual({ demo: true, second: true });
  });
  it('completePractice ignores unknown units', () => {
    const h = home();
    expect(reduce(h, { type: 'completePractice', unitKey: 'nope', xp: 10 })).toBe(h);
  });
  it('setLang changes lang and progress.lang but not the screen', () => {
    const l = reduce(home(), { type: 'openLearn', unitKey: 'demo' });
    const s = reduce(l, { type: 'setLang', lang: 'ja' });
    expect(s.lang).toBe('ja');
    expect(s.progress.lang).toBe('ja');
    expect(s.screen).toEqual(l.screen);
  });
  it('goHome returns to home and keeps progress', () => {
    const p = reduce(reduce(home(), { type: 'openPractice', unitKey: 'demo' }), { type: 'completePractice', unitKey: 'demo', xp: 5 });
    const h = reduce(p, { type: 'goHome' });
    expect(h.screen).toEqual({ name: 'home' });
    expect(h.progress).toEqual(p.progress);
  });
});

describe('suggestedUnit', () => {
  it('returns the first ready unit not practiced, then null', () => {
    expect(suggestedUnit(content, empty)?.key).toBe('demo');
    expect(suggestedUnit(content, { ...empty, practiced: { demo: true } })?.key).toBe('second');
    expect(suggestedUnit(content, { ...empty, practiced: { demo: true, second: true } })).toBeNull();
  });

  it('skips soon units across a gap', () => {
    const keys = ['computer', 'agent', 'permissions', 'injection', 'browser', 'powers', 'lockdown'];
    const units: UnitMeta[] = keys.map((k) => ({ ...demoUnit, key: k, status: k === 'powers' ? 'soon' : 'ready' }));
    const c = createContent(units, fixtureParts.types, {});
    const practiced: Record<string, true> = { computer: true, agent: true, permissions: true, injection: true, browser: true };
    expect(suggestedUnit(c, { ...empty, practiced })?.key).toBe('lockdown');
  });

  it('old progress keys still apply', () => {
    const keys = ['computer', 'lockdown'];
    const units: UnitMeta[] = keys.map((k) => ({ ...demoUnit, key: k, status: 'ready' }));
    const c = createContent(units, fixtureParts.types, {});
    const p: Progress = { ...empty, practiced: { computer: true, lockdown: true } };
    expect(suggestedUnit(c, p)).toBeNull();
    const soonLock = createContent([units[0]!, { ...units[1]!, status: 'soon' }], fixtureParts.types, {});
    expect(suggestedUnit(soonLock, p)).toBeNull();
    expect(p.practiced.lockdown).toBe(true);
  });
});
