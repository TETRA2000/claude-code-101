import { readdirSync, readFileSync } from 'node:fs';
import { expect, type Page } from '@playwright/test';
import course from '../content/course.json' with { type: 'json' };
import type { Item, UnitBody, UnitMeta } from '../src/content/types';
import { UI } from '../src/i18n/ui';
import type { Lang } from '../src/i18n/lang';

export const LANGS: readonly Lang[] = ['en', 'ja'];
export const UNITS = course as UnitMeta[];
export const READY = UNITS.filter((u) => u.status === 'ready');
export const SOON = UNITS.filter((u) => u.status === 'soon');
// Every content/units/<key>.json, so a new unit needs no edit here.
const UNITS_DIR = new URL('../content/units/', import.meta.url);
const BODIES: Record<string, UnitBody> = Object.fromEntries(
  readdirSync(UNITS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => [f.slice(0, -'.json'.length), JSON.parse(readFileSync(new URL(f, UNITS_DIR), 'utf8')) as UnitBody]),
);
export const bodyOf = (key: string): UnitBody => {
  const b = BODIES[key];
  if (!b) throw new Error(`no body for ${key}`);
  return b;
};

export const LANG_LABEL: Record<Lang, string> = { en: 'English', ja: '日本語' };
export const setLang = (page: Page, lang: Lang) => page.getByRole('button', { name: LANG_LABEL[lang], exact: true }).click();

export function card(page: Page, unit: UnitMeta, lang: Lang) {
  return page.locator('article').filter({ has: page.getByRole('heading', { name: unit.title[lang], exact: true }) });
}

export async function overflowOf(page: Page): Promise<{ scrollWidth: number; innerWidth: number }> {
  return page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));
}

export async function expectNoOverflow(page: Page, where: string) {
  const o = await overflowOf(page);
  expect(o.scrollWidth, `horizontal overflow at ${where}`).toBeLessThanOrEqual(o.innerWidth);
}

/** Shared ARMED wait: Check/Continue ignore activation for ACTIVATION_GUARD_MS after appearing. */
const GUARD_WAIT = 450;

export async function selectAnswer(page: Page, item: Item, lang: Lang, wrong = false): Promise<void> {
  const ui = UI[lang];
  const btn = (name: string) => page.getByRole('button', { name, exact: true }).first().click();
  switch (item.type) {
    case 'approve': {
      const labels = [ui.approveYes, item.alwaysLabel[lang], ui.approveNo];
      const right = item.accept[0] ?? 'yes';
      const idx = wrong ? [0, 1, 2].find((i) => !item.accept.includes(['yes', 'always', 'no'][i] as 'yes')) ?? 0 : ['yes', 'always', 'no'].indexOf(right);
      await btn(labels[idx] ?? '');
      return;
    }
    case 'predict': {
      const i = wrong ? item.opts.findIndex((_, k) => k !== item.answer) : item.answer;
      await btn(item.opts[i]?.text[lang] ?? '');
      return;
    }
    case 'setup':
    case 'combo': {
      const i = wrong ? item.opts.findIndex((_, k) => !item.accept.includes(k)) : (item.accept[0] ?? 0);
      await btn(item.opts[i]?.text[lang] ?? '');
      return;
    }
    case 'chain': {
      const i = wrong ? item.steps.findIndex((_, k) => k !== item.answer) : item.answer;
      const s = item.steps[i];
      await page.locator('button[aria-pressed]').filter({ hasText: `${i + 1}. ${s?.tool} ${s?.target}` }).first().click();
      return;
    }
    case 'hidden': {
      await page.getByRole('button', { name: ui.asClaudeSees, exact: true }).click();
      const lines = page.locator('[data-source] button');
      const picks = wrong ? [item.lines.findIndex((_, k) => !item.answer.includes(k))] : item.answer;
      for (const i of picks) await lines.nth(i).click();
      return;
    }
    case 'order': {
      const cur = [...item.start];
      const label = (id: string) => item.steps.find((s) => s.id === id)?.text[lang] ?? id;
      if (wrong) {
        // Leave the starting order if it is already wrong, otherwise swap the first two steps.
        const target = item.steps.map((s) => s.id);
        if (cur.every((id, i) => id === target[i])) {
          const first = cur[0];
          if (first !== undefined) await page.getByRole('button', { name: `${ui.moveDown}: ${label(first)}`, exact: true }).click();
        }
        return;
      }
      for (let p = 0; p < item.steps.length; p++) {
        const want = item.steps[p]?.id ?? '';
        let at = cur.indexOf(want);
        while (at > p) {
          await page.getByRole('button', { name: `${ui.moveUp}: ${label(want)}`, exact: true }).click();
          cur.splice(at - 1, 0, ...cur.splice(at, 1));
          at--;
        }
      }
      return;
    }
    case 'pairs': {
      for (const id of item.order) {
        const p = item.items.find((x) => x.id === id);
        if (!p) continue;
        await btn(p.left[lang]);
        await btn(p.right[lang]);
      }
      return;
    }
    case 'decode': {
      for (const id of item.order) {
        const p = item.parts.find((x) => x.id === id);
        if (!p) continue;
        await btn(p.code);
        await btn(p.means[lang]);
      }
      return;
    }
  }
}

export const isAuto = (item: Item) => item.type === 'pairs' || item.type === 'decode';

/** Answers one item. `ok=false` answers wrongly (never for pairs/decode, which cannot lose hearts). */
export async function answerItem(page: Page, item: Item, lang: Lang, ok = true, onScreen?: (label: string) => Promise<void>) {
  const ui = UI[lang];
  await selectAnswer(page, item, lang, !ok);
  if (onScreen) await onScreen(`${item.id} answered`);
  if (isAuto(item)) {
    // Auto-graded: feedback appears by itself.
  } else {
    await page.waitForTimeout(GUARD_WAIT);
    await page.getByRole('button', { name: ui.check, exact: true }).click();
  }
  await expect(page.getByRole('region', { name: ui.feedback })).toBeVisible();
  if (onScreen) await onScreen(`${item.id} feedback`);
  await page.waitForTimeout(GUARD_WAIT);
  await page.getByRole('button', { name: ui.continue, exact: true }).click();
}

export async function openUnit(page: Page, unit: UnitMeta, lang: Lang, which: 'learn' | 'practice') {
  const ui = UI[lang];
  await card(page, unit, lang).getByRole('button', { name: which === 'learn' ? ui.learn : ui.practice, exact: true }).click();
}

/**
 * No copy buttons anywhere. Lines inside a mock document ([data-source]) are quoted lesson text
 * (e.g. "website copy"), not controls, so they are excluded.
 */
export async function expectNoCopyButtons(page: Page) {
  const chrome = page.locator(':not([data-source] *)');
  await expect(page.getByRole('button', { name: /copy|コピー/i }).and(chrome)).toHaveCount(0);
}
