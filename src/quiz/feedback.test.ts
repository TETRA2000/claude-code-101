import { describe, expect, it } from 'vitest';
import type { ApproveItem, ChainItem, Item } from '../content/types';
import { UI } from '../i18n/ui';
import { fixtureParts, wave2Items } from '../test/fixtures';
import { feedbackFor } from './feedback';
import { freshAnswer } from './grade';
import type { AnswerState } from './types';

const items = fixtureParts.bodies.demo!.items;
const byType = (t: string): Item => items.find((i) => i.type === t)!;
const answered = (item: Item, patch: Partial<AnswerState>): AnswerState => ({ ...freshAnswer(item), checked: true, ...patch });

const dangerous: ApproveItem = {
  ...(byType('approve') as ApproveItem),
  id: 'danger',
  accept: ['no'],
  outcomes: {
    yes: { feedback: { en: 'It would send your keys.', ja: '鍵が送られてしまいます。' }, headline: { en: 'This posts your .env', ja: 'これは .env を送信します' } },
    always: { feedback: { en: 'Worse: always.', ja: 'さらに悪い：常に。' }, headline: { en: 'Always posts it', ja: '常に送信します' } },
    no: { feedback: { en: 'Good denial.', ja: '良い拒否です。' } },
  },
};

const fourOption: ApproveItem = {
  ...dangerous,
  id: 'danger4',
  choices: ['yes', 'always', 'auto', 'no'],
  outcomes: {
    ...dangerous.outcomes,
    auto: {
      feedback: { en: 'It posts .env, and auto mode stops asking you.', ja: '.env が送信され、auto モードでは今後確認されません。' },
      headline: { en: 'Posts .env, then stops asking', ja: '.env を送信し、確認も止まる' },
    },
  },
};

describe('feedbackFor', () => {
  it('dangerous approve + yes gets a headline and the breaking title', () => {
    const f = feedbackFor(dangerous, answered(dangerous, { sel: 0, ok: false }), 0, 'en');
    expect(f.ok).toBe(false);
    expect(f.headline).toBe('This posts your .env');
    expect(f.title).toBe(UI.en.breaking);
    expect(f.body).toBe('It would send your keys.');
  });

  it('four-option approve: sel 2 is auto, with its own feedback and headline', () => {
    const f = feedbackFor(fourOption, answered(fourOption, { sel: 2, ok: false }), 0, 'en');
    expect(f.body).toBe('It posts .env, and auto mode stops asking you.');
    expect(f.headline).toBe('Posts .env, then stops asking');
    expect(f.title).toBe(UI.en.breaking);
    expect(feedbackFor(fourOption, answered(fourOption, { sel: 3, ok: true }), 0, 'en').body).toBe('Good denial.');
  });

  it('automode shows the feedback for the picked outcome', () => {
    const item = byType('automode');
    expect(feedbackFor(item, answered(item, { sel: 1, ok: false }), 0, 'en').body).toBe('Not blocked: pushing to this repo is allowed.');
    expect(feedbackFor(item, answered(item, { sel: 0, ok: true }), 0, 'ja').body).toBe('正解：実行されます。');
  });

  it('harmless approve + no has no headline and uses the no feedback', () => {
    const item = byType('approve');
    const f = feedbackFor(item, answered(item, { sel: 3, ok: false }), 0, 'en');
    expect(f.headline).toBeNull();
    expect(f.title).toBe(UI.en.notQuite);
    expect(f.body).toBe('This was safe.');
    expect(f.explain).toBe('Building is routine.');
  });

  it('ok answers get rotating praise', () => {
    const item = byType('approve');
    const f = feedbackFor(item, answered(item, { sel: 0, ok: true }), 5, 'en');
    expect(f.title).toBe(UI.en.praise[5 % UI.en.praise.length]);
    expect(f.headline).toBeNull();
  });

  it('chain picks early or late', () => {
    const item = byType('chain') as ChainItem;
    expect(feedbackFor(item, answered(item, { sel: 0, ok: false }), 0, 'en').body).toBe(item.early.en);
    expect(feedbackFor(item, answered(item, { sel: 2, ok: false }), 0, 'en').body).toBe(item.late.en);
  });

  it('body is null without option feedback and for pairs', () => {
    const predict = byType('predict');
    expect(feedbackFor(predict, answered(predict, { sel: 1, ok: true }), 0, 'en').body).toBeNull();
    expect(feedbackFor(predict, answered(predict, { sel: 0, ok: false }), 0, 'en').body).toBe('.env is hidden.');
    const pairs = byType('pairs');
    expect(feedbackFor(pairs, answered(pairs, { ok: true }), 0, 'en').body).toBeNull();
  });

  it('setup and combo use the chosen option feedback', () => {
    const setup = byType('setup');
    expect(feedbackFor(setup, answered(setup, { sel: 1, ok: false }), 0, 'en').body).toBe('Nothing would stop a bad command.');
  });

  it('wave 2 choice items use the chosen option feedback', () => {
    for (const type of ['scopes', 'package', 'inside', 'allowlist']) {
      const it = wave2Items.find((i) => i.type === type)!;
      if (!('opts' in it)) throw new Error('expected options');
      expect(feedbackFor(it, answered(it, { sel: 1 }), 0, 'en').body).toBe(it.opts[1]!.feedback!.en);
    }
  });

  it('returns Japanese strings for ja', () => {
    const f = feedbackFor(dangerous, answered(dangerous, { sel: 0, ok: false }), 0, 'ja');
    expect(f.headline).toBe('これは .env を送信します');
    expect(f.title).toBe(UI.ja.breaking);
    expect(f.body).toBe('鍵が送られてしまいます。');
  });
});

describe('rule feedback', () => {
  const rule = byType('rule');
  it('lists each test call with ok / not ok', () => {
    const fb = feedbackFor(rule, answered(rule, { list: 2, sel: 0, ok: false }), 0, 'en');
    expect(fb.checks).toEqual([
      { label: 'curl https://example.com', ok: false },
      { label: 'npm test', ok: true },
      { label: 'ls -la', ok: true },
    ]);
  });
  it('all ok for the right rule; no checks on other items', () => {
    expect(feedbackFor(rule, answered(rule, { list: 2, sel: 1, ok: true }), 0, 'en').checks?.every((c) => c.ok)).toBe(true);
    expect(feedbackFor(byType('predict'), answered(byType('predict'), { sel: 1, ok: true }), 0, 'en').checks).toBeUndefined();
  });
});
