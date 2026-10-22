import { describe, expect, it } from 'vitest';
import { bossDanger, bossSafe } from '../test/fixtures';
import { BOSS_SECONDS, bossCurrent, bossReducer, bossRight, bossXp, isAllowed, startBoss, type BossState } from './boss';
import { XP_FIRST_TRY } from '../state/rules';

const items = [bossSafe, bossDanger];
const running = (seconds = BOSS_SECONDS): BossState => bossReducer(startBoss(items, seconds), { type: 'start' });

describe('boss reducer', () => {
  it('runs for 60 seconds by default and starts on the intro', () => {
    expect(BOSS_SECONDS).toBe(60);
    const s = startBoss(items);
    expect(s.phase).toBe('intro');
    expect(s.left).toBe(60);
    expect(s.queue).toEqual(['boss-t-safe', 'boss-d-danger']);
  });

  it('start moves to run with a full clock', () => {
    const s = running(5);
    expect(s.phase).toBe('run');
    expect(s.left).toBe(5);
    expect(bossCurrent(s)?.id).toBe('boss-t-safe');
  });

  it('ignores ticks and answers on the intro', () => {
    const s = startBoss(items);
    expect(bossReducer(s, { type: 'tick' })).toBe(s);
    expect(bossReducer(s, { type: 'answer', choice: 'yes' })).toBe(s);
  });

  it('tick counts down, and tick at left 1 moves to recap', () => {
    let s = running(2);
    s = bossReducer(s, { type: 'tick' });
    expect(s).toMatchObject({ phase: 'run', left: 1 });
    s = bossReducer(s, { type: 'tick' });
    expect(s).toMatchObject({ phase: 'recap', left: 0 });
  });

  it('answer records ok per accept and moves on', () => {
    let s = running();
    s = bossReducer(s, { type: 'answer', choice: 'always' });
    expect(s.answers).toEqual([{ id: 'boss-t-safe', choice: 'always', ok: true }]);
    expect(s.idx).toBe(1);
    s = bossReducer(s, { type: 'answer', choice: 'yes' });
    expect(s.answers[1]).toEqual({ id: 'boss-d-danger', choice: 'yes', ok: false });
  });

  it('answering the last prompt moves to recap, with time left', () => {
    let s = running();
    s = bossReducer(s, { type: 'answer', choice: 'yes' });
    s = bossReducer(s, { type: 'answer', choice: 'no' });
    expect(s.phase).toBe('recap');
    expect(s.left).toBe(60);
    expect(bossRight(s)).toBe(2);
    expect(bossXp(s)).toBe(2 * XP_FIRST_TRY);
  });

  it('ignores answers and ticks after recap', () => {
    let s = running(1);
    s = bossReducer(s, { type: 'tick' });
    expect(s.phase).toBe('recap');
    expect(bossReducer(s, { type: 'answer', choice: 'yes' })).toBe(s);
    expect(bossReducer(s, { type: 'tick' })).toBe(s);
  });

  it('ignores a choice the prompt does not offer', () => {
    let s = running();
    s = bossReducer(s, { type: 'answer', choice: 'no' });
    expect(bossReducer(s, { type: 'answer', choice: 'auto' })).toBe(s); // desktop prompt: yes / no only
  });

  it('start from the recap runs again from scratch; start while running is ignored', () => {
    let s = running(1);
    expect(bossReducer(s, { type: 'start' })).toBe(s);
    s = bossReducer(bossReducer(s, { type: 'answer', choice: 'yes' }), { type: 'tick' });
    expect(s.phase).toBe('recap');
    s = bossReducer(s, { type: 'start' });
    expect(s).toMatchObject({ phase: 'run', idx: 0, left: 1, answers: [] });
  });

  it('treats every choice but No as allowing the action', () => {
    expect(['yes', 'always', 'auto', 'no'].map((c) => isAllowed(c as 'yes'))).toEqual([true, true, true, false]);
  });
});
