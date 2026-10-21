import { describe, expect, it } from 'vitest';
import { localProgressStore, parseProgress, STORAGE_KEY } from './progress';

const EMPTY = { lang: null, learned: {}, practiced: {}, xp: 0 };

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

describe('parseProgress', () => {
  it('returns empty progress for null', () => {
    expect(parseProgress(null)).toEqual(EMPTY);
  });
  it.each(['{oops', '[]', '{"xp":-3,"lang":"fr","learned":{"a":1}}'])('falls back to empty for %s', (raw) => {
    expect(parseProgress(raw)).toEqual(EMPTY);
  });
  it('keeps valid fields', () => {
    const raw = JSON.stringify({ lang: 'ja', learned: { a: true }, practiced: { b: true, c: 0 }, xp: 25 });
    expect(parseProgress(raw)).toEqual({ lang: 'ja', learned: { a: true }, practiced: { b: true }, xp: 25 });
  });
});

describe('localProgressStore', () => {
  it('round-trips', () => {
    const s = memoryStorage();
    const store = localProgressStore(() => s);
    const p = { lang: 'en' as const, learned: { demo: true as const }, practiced: {}, xp: 40 };
    store.save(p);
    expect(JSON.parse(s.getItem(STORAGE_KEY)!)).toEqual(p);
    expect(store.load()).toEqual(p);
  });
  it('loads empty and does not throw on save when storage access throws', () => {
    const store = localProgressStore(() => {
      throw new Error('denied');
    });
    expect(store.load()).toEqual(EMPTY);
    expect(() => store.save(EMPTY)).not.toThrow();
  });
  it('handles a missing storage and throwing methods', () => {
    expect(localProgressStore(() => undefined).load()).toEqual(EMPTY);
    const bad = {
      getItem: () => {
        throw new Error('x');
      },
      setItem: () => {
        throw new Error('x');
      },
    } as unknown as Storage;
    const store = localProgressStore(() => bad);
    expect(store.load()).toEqual(EMPTY);
    expect(() => store.save(EMPTY)).not.toThrow();
  });
});
