import { expect, test } from '@playwright/test';
import { STORAGE_KEY } from '../src/storage/progress';
import { UI } from '../src/i18n/ui';
import { bodyOf, openUnit, READY, setLang } from './helpers';

const unit = READY[2]!; // unit 3: permissions
const first = bodyOf(unit.key).items[0]!; // an approve item

test('language switch keeps the run, and the choice survives a reload', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((k) => localStorage.removeItem(k), STORAGE_KEY);
  await page.reload();

  await setLang(page, 'ja');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');

  await openUnit(page, unit, 'ja', 'practice');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(first.prompt.ja);
  const answer = page.getByRole('button', { name: UI.ja.approveNo, exact: true });
  await answer.click();
  await expect(answer).toHaveAttribute('aria-pressed', 'true');

  await setLang(page, 'en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(first.prompt.en);
  await expect(page.getByRole('button', { name: UI.en.approveNo, exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText(UI.en.heartsLeft(5))).toBeAttached();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await setLang(page, 'ja');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(UI.ja.heroTitle);
});
