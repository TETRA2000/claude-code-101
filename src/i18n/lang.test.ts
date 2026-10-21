import { describe, expect, it } from 'vitest';
import { detectLang, isLang, t } from './lang';
import { SAME_IN_BOTH, UI } from './ui';

describe('detectLang', () => {
  it('stored choice wins', () => expect(detectLang('ja', ['en-US'])).toBe('ja'));
  it('uses ja when the first browser language is ja', () =>
    expect(detectLang(null, ['ja-JP', 'en'])).toBe('ja'));
  it('uses en otherwise', () => expect(detectLang(null, ['en-GB'])).toBe('en'));
  it('ignores an invalid stored value', () => expect(detectLang('fr', [])).toBe('en'));
  it('ignores a non-string stored value', () => expect(detectLang(42, [])).toBe('en'));
});

describe('isLang / t', () => {
  it('validates', () => {
    expect(isLang('en')).toBe(true);
    expect(isLang('fr')).toBe(false);
  });
  it('picks by language', () => expect(t({ en: 'a', ja: 'b' }, 'ja')).toBe('b'));
});

describe('UI', () => {
  const cases: [string, string, string][] = [];
  for (const key of Object.keys(UI.en) as (keyof typeof UI.en)[]) {
    const en = UI.en[key];
    const ja = UI.ja[key];
    if (key === 'praise') {
      (en as string[]).forEach((e, i) => cases.push([`praise[${i}]`, e, (ja as string[])[i] ?? '']));
    } else if (typeof en === 'function') {
      cases.push([key, String((en as (n: never) => string)(3 as never)), String((ja as (n: never) => string)(3 as never))]);
    } else {
      cases.push([key, en as string, ja as string]);
    }
  }
  it.each(cases)('%s is translated', (key, en, ja) => {
    expect(en).not.toBe('');
    expect(ja).not.toBe('');
    if (!SAME_IN_BOTH.has(key)) expect(ja).not.toBe(en);
  });
  it('has the same number of praise lines', () =>
    expect(UI.ja.praise.length).toBe(UI.en.praise.length));
});
