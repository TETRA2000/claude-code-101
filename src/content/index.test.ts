import { describe, expect, it, vi } from 'vitest';
import { createContent, type BodyLoader } from './index';
import { bossParts, fixtureParts } from '../test/fixtures';
import type { UnitBody } from './types';

/** Loaders that hand back `bodies` and count calls per key. */
function lazy(bodies: Record<string, UnitBody>) {
  const calls: Record<string, number> = {};
  const loaders: Record<string, BodyLoader> = {};
  for (const [key, body] of Object.entries(bodies)) {
    loaders[key] = () => {
      calls[key] = (calls[key] ?? 0) + 1;
      return Promise.resolve(body);
    };
  }
  return { loaders, calls };
}

describe('createContent with loaders', () => {
  it('has no body until the unit loads, then has it', async () => {
    const { loaders, calls } = lazy(fixtureParts.bodies);
    const c = createContent(fixtureParts.units, fixtureParts.types, {}, loaders);
    expect(c.isLoaded('demo')).toBe(false);
    expect(c.bodyOf('demo')).toBeUndefined();
    await Promise.all([c.load('demo'), c.load('demo')]);
    expect(c.isLoaded('demo')).toBe(true);
    expect(c.bodyOf('demo')).toEqual(fixtureParts.bodies.demo);
    await c.load('demo');
    expect(calls.demo).toBe(1);
  });

  it('treats a unit with no body file as loaded, with no body', () => {
    const c = createContent(fixtureParts.units, fixtureParts.types, {}, {});
    expect(c.isLoaded('demo')).toBe(true);
    expect(c.bodyOf('demo')).toBeUndefined();
  });

  it('a boss loads the units its picks come from, and only those', async () => {
    const parts = bossParts();
    const units = [...fixtureParts.units, ...parts.units];
    const { loaders, calls } = lazy({ ...fixtureParts.bodies, ...parts.bodies });
    const c = createContent(units, fixtureParts.types, {}, loaders);
    await c.load('boss');
    expect(c.isLoaded('boss')).toBe(true);
    expect(c.bodyOf('boss')!.items.map((it) => it.id)).toEqual(parts.bodies.boss!.picks);
    expect(calls).toEqual({ boss: 1, 'bsrc-a': 1, 'bsrc-b': 1 });
    expect(c.isLoaded('bsrc-a')).toBe(false); // fetched for the boss, but not opened yet
  });

  it('a boss whose pick ids do not name their unit loads every unit', async () => {
    const parts = bossParts();
    const renamed = (id: string) => `x-${id}`;
    for (const key of ['bsrc-a', 'bsrc-b']) for (const it of parts.bodies[key]!.items) it.id = renamed(it.id);
    parts.bodies.boss!.picks = parts.bodies.boss!.picks!.map(renamed);
    const { loaders, calls } = lazy(parts.bodies);
    const c = createContent(parts.units, fixtureParts.types, {}, loaders);
    await c.load('boss');
    expect(calls).toEqual({ boss: 1, 'bsrc-a': 1, 'bsrc-b': 1 });
    expect(c.bodyOf('boss')!.items.map((it) => it.id)).toEqual(parts.bodies.boss!.picks);
  });

  it('a failed load can be retried', async () => {
    const loader = vi.fn<BodyLoader>().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(fixtureParts.bodies.demo!);
    const c = createContent(fixtureParts.units, fixtureParts.types, {}, { demo: loader });
    await expect(c.load('demo')).rejects.toThrow('offline');
    expect(c.isLoaded('demo')).toBe(false);
    await c.load('demo');
    expect(c.bodyOf('demo')).toEqual(fixtureParts.bodies.demo);
  });

  it('loadAll loads every unit', async () => {
    const parts = bossParts();
    const { loaders } = lazy(parts.bodies);
    const c = createContent(parts.units, fixtureParts.types, {}, loaders);
    await c.loadAll();
    for (const u of parts.units) expect(c.bodyOf(u.key), u.key).toBeDefined();
  });
});
