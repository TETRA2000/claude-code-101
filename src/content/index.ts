import course from '../../content/course.json';
import practiceTypes from '../../content/practice-types.json';
import type { PracticeTypeInfo, UnitBody, UnitMeta } from './types';

export interface Content {
  units: readonly UnitMeta[];
  practiceTypes: readonly PracticeTypeInfo[];
  unitByKey(key: string): UnitMeta | undefined;
  bodyOf(key: string): UnitBody | undefined;
  practiceType(key: string): PracticeTypeInfo | undefined;
}

export function createContent(
  units: UnitMeta[],
  types: PracticeTypeInfo[],
  bodies: Record<string, UnitBody>,
): Content {
  return {
    units,
    practiceTypes: types,
    unitByKey: (key) => units.find((u) => u.key === key),
    bodyOf: (key) => (Object.hasOwn(bodies, key) ? bodies[key] : undefined),
    practiceType: (key) => types.find((p) => p.key === key),
  };
}

const modules = import.meta.glob<{ default: UnitBody }>('../../content/units/*.json', { eager: true });

function bodiesFrom(mods: Record<string, { default: UnitBody }>): Record<string, UnitBody> {
  const out: Record<string, UnitBody> = {};
  for (const [path, mod] of Object.entries(mods)) {
    const key = path.slice(path.lastIndexOf('/') + 1).replace(/\.json$/, '');
    out[key] = mod.default;
  }
  return out;
}

export const content: Content = createContent(
  course as UnitMeta[],
  practiceTypes as PracticeTypeInfo[],
  bodiesFrom(modules),
);
