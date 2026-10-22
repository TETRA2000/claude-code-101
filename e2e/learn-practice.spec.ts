import { expect, test } from '@playwright/test';
import { STORAGE_KEY } from '../src/storage/progress';
import { UI } from '../src/i18n/ui';
import { answerItem, bodyOf, card, GUARD_WAIT, openUnit, READY, selectAnswer } from './helpers';

const unit = READY[0]!; // unit 1: computer
const ui = UI.en;

test('learn unit 1, practice it with one miss, finish, and keep the XP', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.removeItem(k), STORAGE_KEY);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await openUnit(page, unit, 'en', 'learn');
  const { cards, items } = bodyOf(unit.key);
  for (let i = 0; i < cards.length - 1; i++) {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(cards[i]!.title.en);
    await page.getByRole('button', { name: ui.next, exact: true }).click();
  }
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(cards[cards.length - 1]!.title.en);
  await page.getByRole('button', { name: ui.practiceThis, exact: true }).click();

  await expect(page.getByText(ui.heartsLeft(5))).toBeAttached();
  // Item 1 (predict): right first try.
  await answerItem(page, items[0]!, 'en');
  // Item 2 (pairs) completes itself, no hearts at stake.
  await answerItem(page, items[1]!, 'en');
  await expect(page.getByText(ui.heartsLeft(5))).toBeAttached();
  // Item 3 (predict): wrong answer costs a heart and is re-queued.
  await answerItem(page, items[2]!, 'en', false);
  await expect(page.getByText(ui.heartsLeft(4))).toBeAttached();

  // Everything else right, then the re-queued item 3.
  for (const it of items.slice(3)) await answerItem(page, it, 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(items[2]!.prompt.en);
  await answerItem(page, items[2]!, 'en');

  await expect(page.getByRole('heading', { name: ui.doneTitle })).toBeVisible();
  await page.getByRole('button', { name: ui.continue, exact: true }).click();

  await expect(card(page, unit, 'en').getByText(ui.done, { exact: true })).toBeVisible();
  const xp = await page.locator('header').getByText(/ XP$/).first().innerText();
  expect(xp).not.toBe('0 XP');

  await page.reload();
  await expect(page.locator('header').getByText(xp, { exact: true }).first()).toBeVisible();
  await expect(card(page, unit, 'en').getByText(ui.done, { exact: true })).toBeVisible();
});

test('the boss shows the recap when time runs out, and counts as done only with an answer (?bossSeconds=3)', async ({ page }) => {
  const boss = READY.find((u) => u.mode === 'boss')!;
  const [first, second] = bodyOf(boss.key).items;
  await page.goto('/?bossSeconds=3');
  await page.evaluate((k) => localStorage.removeItem(k), STORAGE_KEY);
  await page.reload();

  // Run 1: no answers. Time runs out, the recap shows, and the boss is not done.
  await openUnit(page, boss, 'en', 'practice');
  await expect(page.getByText(ui.heartsLeft(5))).not.toBeAttached();
  await page.getByRole('button', { name: ui.bossStart, exact: true }).click();
  const began = Date.now();
  await expect(page.getByRole('timer')).toHaveText('0:03');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(first!.prompt.en);
  // A 3 s clock: not much later (time-out bound), and not early (a double-speed clock ends after ~1.5 s).
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(ui.bossTimeUp, { timeout: 4500 });
  expect(Date.now() - began).toBeGreaterThanOrEqual(2500);
  await expect(page.getByText(ui.bossNoAnswers)).toBeVisible();
  await page.getByRole('button', { name: ui.continue, exact: true }).click();
  await expect(card(page, boss, 'en').getByText(ui.done, { exact: true })).toHaveCount(0);

  // Run 2: answer one prompt, then let time run out. Now the boss is done.
  await openUnit(page, boss, 'en', 'practice');
  await page.getByRole('button', { name: ui.bossStart, exact: true }).click();
  await page.waitForTimeout(GUARD_WAIT);
  await selectAnswer(page, first!, 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(second!.prompt.en);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(ui.bossTimeUp, { timeout: 4500 });
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await page.getByRole('button', { name: ui.continue, exact: true }).click();
  await expect(card(page, boss, 'en').getByText(ui.done, { exact: true })).toBeVisible();
});
