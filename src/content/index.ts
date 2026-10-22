import course from '../../content/course.json';
import practiceTypes from '../../content/practice-types.json';
import { findPick, resolvePicks } from './picks';
import type { PracticeTypeInfo, UnitBody, UnitMeta } from './types';

export interface Content {
  units: readonly UnitMeta[];
  practiceTypes: readonly PracticeTypeInfo[];
  unitByKey(key: string): UnitMeta | undefined;
  /** The unit's body once loaded (see `load`), else undefined. */
  bodyOf(key: string): UnitBody | undefined;
  practiceType(key: string): PracticeTypeInfo | undefined;
  /** True once `bodyOf(key)` is complete: the body, and for a boss the units its picks come from. */
  isLoaded(key: string): boolean;
  /** Loads the unit's body; a boss also loads the units it picks from. Resolves when `isLoaded(key)`. */
  load(key: string): Promise<void>;
  /** Loads every unit body (validation and tests). */
  loadAll(): Promise<void>;
}

/** Fetches one unit body: a dynamic import in the app. */
export type BodyLoader = () => Promise<UnitBody>;

/**
 * `rawBodies` are available at once; `loaders` fetch the rest on demand. A boss body is only
 * complete when the units its picks come from are loaded too, since `resolvePicks` copies from them.
 */
export function createContent(
  units: UnitMeta[],
  types: PracticeTypeInfo[],
  rawBodies: Record<string, UnitBody>,
  loaders: Record<string, BodyLoader> = {},
): Content {
  const raw: Record<string, UnitBody> = { ...rawBodies };
  const pending = new Map<string, Promise<void>>();
  // A boss unit's items are copies of its picks from the other units.
  let bodies = resolvePicks(units, raw);
  const loaded = new Set(Object.keys(raw));
  const isBoss = (key: string) => units.find((u) => u.key === key)?.mode === 'boss';
  // A boss given up front waits for any of its units that still have to be fetched.
  for (const key of loaded) if (isBoss(key) && units.some((u) => u.mode !== 'boss' && !Object.hasOwn(raw, u.key) && Object.hasOwn(loaders, u.key))) loaded.delete(key);

  function fetchRaw(key: string): Promise<void> {
    if (Object.hasOwn(raw, key) || !Object.hasOwn(loaders, key)) return Promise.resolve();
    let p = pending.get(key);
    if (!p) {
      p = loaders[key]!().then(
        (body) => {
          raw[key] = body;
          pending.delete(key);
        },
        (err: unknown) => {
          pending.delete(key); // let a later `load` retry
          throw err;
        },
      );
      pending.set(key, p);
    }
    return p;
  }

  /** The unit a pick id names by its prefix (`permissions-approve-2` → `permissions`), longest key first. */
  function ownerOf(id: string): string | undefined {
    return units
      .filter((u) => u.mode !== 'boss' && id.startsWith(`${u.key}-`))
      .sort((a, b) => b.key.length - a.key.length)[0]?.key;
  }

  async function load(key: string): Promise<void> {
    if (loaded.has(key)) return;
    await fetchRaw(key);
    if (isBoss(key) && Object.hasOwn(raw, key)) {
      const picks = raw[key]!.picks ?? [];
      await Promise.all([...new Set(picks.map(ownerOf))].filter((k) => k !== undefined).map(fetchRaw));
      // Ids are not required to carry their unit's key, so fall back to every unit.
      if (picks.some((id) => !findPick(units, raw, id))) await Promise.all(units.filter((u) => u.mode !== 'boss').map((u) => fetchRaw(u.key)));
    }
    bodies = resolvePicks(units, raw);
    if (Object.hasOwn(raw, key)) loaded.add(key);
  }

  return {
    units,
    practiceTypes: types,
    unitByKey: (key) => units.find((u) => u.key === key),
    bodyOf: (key) => (loaded.has(key) && Object.hasOwn(bodies, key) ? bodies[key] : undefined),
    practiceType: (key) => types.find((p) => p.key === key),
    isLoaded: (key) => loaded.has(key) || (!Object.hasOwn(raw, key) && !Object.hasOwn(loaders, key)),
    load,
    loadAll: async () => {
      await Promise.all(Object.keys(loaders).map(fetchRaw));
      await Promise.all([...Object.keys(raw)].map(load));
    },
  };
}

// Unit bodies are split into their own chunks and fetched when the learner opens a unit.
const modules = import.meta.glob<UnitBody>('../../content/units/*.json', { import: 'default' });

function loadersFrom(mods: Record<string, BodyLoader>): Record<string, BodyLoader> {
  const out: Record<string, BodyLoader> = {};
  for (const [path, loader] of Object.entries(mods)) {
    const key = path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '');
    out[key] = loader;
  }
  return out;
}

export const content: Content = createContent(
  course as UnitMeta[],
  practiceTypes as PracticeTypeInfo[],
  {},
  loadersFrom(modules),
);
