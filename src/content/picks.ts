// Boss picks: a boss unit's file lists `picks`, the ids of published approve items in other units.
// The loader copies those items into the boss body. No boss prompt is written fresh.
import type { ApproveItem, UnitBody, UnitMeta } from './types';

/** Where a pick id was published: the unit and the item, or undefined when no non-boss unit has it. */
export function findPick(units: readonly UnitMeta[], bodies: Record<string, UnitBody>, id: string): { unit: UnitMeta; item: UnitBody['items'][number] } | undefined {
  for (const unit of units) {
    if (unit.mode === 'boss' || !Object.hasOwn(bodies, unit.key)) continue;
    const item = bodies[unit.key]!.items.find((it) => it.id === id);
    if (item) return { unit, item };
  }
  return undefined;
}

/**
 * The boss copy of a published approve item: `fromUnit` names its unit, `more` falls back to the
 * unit's first docs entry, and the decode hint is dropped (the timed run has no hints).
 */
export function bossCopy(item: ApproveItem, unit: UnitMeta): ApproveItem {
  const { decode: _hint, ...rest } = structuredClone(item);
  const more = rest.more ?? unit.docs?.[0]?.ref;
  return { ...rest, ...(more ? { more: structuredClone(more) } : {}), fromUnit: unit.key };
}

/**
 * `bodies` with each boss unit's `items` set to copies of its picks, in pick order. Picks that are
 * missing or not approve items are left out here; the validator reports them.
 */
export function resolvePicks(units: readonly UnitMeta[], bodies: Record<string, UnitBody>): Record<string, UnitBody> {
  const out: Record<string, UnitBody> = { ...bodies };
  for (const u of units) {
    if (u.mode !== 'boss' || !Object.hasOwn(bodies, u.key)) continue;
    const body = bodies[u.key]!;
    const items: ApproveItem[] = [];
    for (const id of body.picks ?? []) {
      const found = findPick(units, bodies, id);
      if (found?.item.type === 'approve') items.push(bossCopy(found.item, found.unit));
    }
    out[u.key] = { ...body, items };
  }
  return out;
}
