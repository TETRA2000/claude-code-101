import { describe, expect, it } from 'vitest';
import { AUTO_OUTCOMES, type ApproveItem, type AutoModeItem, type ChoiceItem, type Item, type SettingsItem } from '../content/types';
import { fixtureContent } from '../test/fixtures';
import { canCheck, freshAnswer, isAutoGraded, isCorrect } from './grade';

const items = fixtureContent.bodyOf('demo')!.items;
const get = <T extends Item>(type: T['type']) => items.find((i) => i.type === type) as T;
const ans = (item: Item, patch: Partial<ReturnType<typeof freshAnswer>>) => ({ ...freshAnswer(item), ...patch });

describe('isCorrect', () => {
  it('approve is correct iff the chosen button is accepted', () => {
    const harmless: ApproveItem = { ...get<ApproveItem>('approve'), choices: ['yes', 'always', 'no'] };
    expect(isCorrect(harmless, ans(harmless, { sel: 0 }))).toBe(true); // yes
    expect(isCorrect(harmless, ans(harmless, { sel: 1 }))).toBe(true); // always
    expect(isCorrect(harmless, ans(harmless, { sel: 2 }))).toBe(false); // no
    const dangerous: ApproveItem = { ...harmless, accept: ['no'] };
    expect(isCorrect(dangerous, ans(dangerous, { sel: 0 }))).toBe(false);
    expect(isCorrect(dangerous, ans(dangerous, { sel: 1 }))).toBe(false);
    expect(isCorrect(dangerous, ans(dangerous, { sel: 2 }))).toBe(true);
  });

  it('approve sel indexes the item\'s own choices (four-option Bash prompt)', () => {
    const four: ApproveItem = { ...get<ApproveItem>('approve'), choices: ['yes', 'always', 'auto', 'no'], accept: ['no'] };
    expect(isCorrect(four, ans(four, { sel: 3 }))).toBe(true); // no
    expect(isCorrect(four, ans(four, { sel: 2 }))).toBe(false); // auto
    expect(isCorrect(four, ans(four, { sel: 4 }))).toBe(false); // out of range
  });

  it('approve without choices defaults to yes / always / no', () => {
    const { choices: _c, ...rest } = get<ApproveItem>('approve');
    const three = rest as ApproveItem;
    expect(isCorrect(three, ans(three, { sel: 1 }))).toBe(true); // always
    expect(isCorrect(three, ans(three, { sel: 2 }))).toBe(false); // no
  });

  it('predict and chain compare sel with answer', () => {
    for (const type of ['predict', 'chain'] as const) {
      const it = get<Extract<Item, { type: typeof type }>>(type);
      expect(isCorrect(it, ans(it, { sel: it.answer }))).toBe(true);
      expect(isCorrect(it, ans(it, { sel: it.answer + 1 }))).toBe(false);
    }
  });

  it('setup and combo accept any index in accept', () => {
    for (const type of ['setup', 'combo'] as const) {
      const it = get<ChoiceItem>(type);
      for (let i = 0; i < it.opts.length; i++) expect(isCorrect(it, ans(it, { sel: i }))).toBe(it.accept.includes(i));
    }
  });

  it('hidden needs exactly the answer set, in any order', () => {
    const base = get<Extract<Item, { type: 'hidden' }>>('hidden');
    const it = { ...base, answer: [1, 2] };
    expect(isCorrect(it, ans(it, { picked: [2, 1] }))).toBe(true);
    expect(isCorrect(it, ans(it, { picked: [1] }))).toBe(false);
    expect(isCorrect(it, ans(it, { picked: [1, 2, 0] }))).toBe(false);
  });

  it('settings needs exactly the answer set, in any order (review and trim too)', () => {
    const base = get<SettingsItem>('settings');
    const it = { ...base, answer: [1, 2] };
    expect(isCorrect(it, ans(it, { picked: [2, 1] }))).toBe(true);
    expect(isCorrect(it, ans(it, { picked: [1] }))).toBe(false);
    expect(isCorrect(it, ans(it, { picked: [1, 2, 0] }))).toBe(false);
    for (const type of ['review', 'trim'] as const) {
      const other = { ...it, type };
      expect(isCorrect(other, ans(other, { picked: [1, 2] }))).toBe(true);
      expect(canCheck(other, freshAnswer(other))).toBe(false);
      expect(canCheck(other, ans(other, { picked: [0] }))).toBe(true);
    }
  });

  it('precedence compares sel with answer', () => {
    const it = get<Extract<Item, { type: 'precedence' }>>('precedence');
    expect(isCorrect(it, ans(it, { sel: it.answer }))).toBe(true);
    expect(isCorrect(it, ans(it, { sel: it.answer + 1 }))).toBe(false);
    expect(canCheck(it, ans(it, { sel: 0 }))).toBe(true);
  });

  it('automode compares the picked outcome (sel indexes AUTO_OUTCOMES) with the answer', () => {
    const it = get<AutoModeItem>('automode');
    expect(it.answer).toBe('runs');
    expect(isCorrect(it, ans(it, { sel: AUTO_OUTCOMES.indexOf('runs') }))).toBe(true);
    expect(isCorrect(it, ans(it, { sel: AUTO_OUTCOMES.indexOf('blocked') }))).toBe(false);
    expect(isCorrect(it, ans(it, { sel: AUTO_OUTCOMES.indexOf('asks') }))).toBe(false);
    expect(isCorrect(it, freshAnswer(it))).toBe(false);
    expect(canCheck(it, ans(it, { sel: 2 }))).toBe(true);
  });

  it('order needs the steps order', () => {
    const it = get<Extract<Item, { type: 'order' }>>('order');
    expect(isCorrect(it, freshAnswer(it))).toBe(false);
    expect(isCorrect(it, ans(it, { order: it.steps.map((s) => s.id) }))).toBe(true);
  });
});

describe('canCheck', () => {
  it('is false with nothing selected and true once something is', () => {
    const p = get<Extract<Item, { type: 'predict' }>>('predict');
    expect(canCheck(p, freshAnswer(p))).toBe(false);
    expect(canCheck(p, ans(p, { sel: 0 }))).toBe(true);
    const h = get<Extract<Item, { type: 'hidden' }>>('hidden');
    expect(canCheck(h, freshAnswer(h))).toBe(false);
    expect(canCheck(h, ans(h, { picked: [0] }))).toBe(true);
  });

  it('is always false for pairs and decode', () => {
    for (const type of ['pairs', 'decode'] as const) {
      const it = get<Item>(type);
      expect(isAutoGraded(it)).toBe(true);
      expect(canCheck(it, ans(it, { sel: 0, picked: [0] }))).toBe(false);
    }
  });

  it('is false once checked', () => {
    const p = get<Extract<Item, { type: 'predict' }>>('predict');
    expect(canCheck(p, ans(p, { sel: 0, checked: true }))).toBe(false);
  });
});

describe('freshAnswer', () => {
  it('starts an order item from its scrambled start', () => {
    const it = get<Extract<Item, { type: 'order' }>>('order');
    expect(freshAnswer(it).order).toEqual(it.start);
  });
});
