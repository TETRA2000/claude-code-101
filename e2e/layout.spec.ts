import { expect, test } from '@playwright/test';
import { UI } from '../src/i18n/ui';
import { answerItem, expectCopyOnlyInTryIt, expectNoCopyButtons, bodyOf, expectNoOverflow, LANGS, openUnit, READY, setLang, SOON, UNITS } from './helpers';

test.describe('layout and safety', () => {
  for (const lang of LANGS) {
    test(`home has no overflow, no copy buttons, and soon units are inert (${lang})`, async ({ page }) => {
      const ui = UI[lang];
      await page.goto('/');
      await setLang(page, lang);
      await expectNoOverflow(page, `home ${lang}`);
      await expectNoCopyButtons(page);
      await expect(page.getByLabel(/copy|コピー/i)).toHaveCount(0);

      const articles = page.locator('article');
      await expect(articles).toHaveCount(UNITS.length);
      const soon = articles.filter({ hasText: ui.comingSoon });
      await expect(soon).toHaveCount(SOON.length);
      for (let i = 0; i < SOON.length; i++) {
        await expect(soon.nth(i).getByRole('button')).toHaveCount(0);
      }
    });

    for (const unit of READY) {
      test(`${unit.key}: every learn card fits (${lang})`, async ({ page }) => {
        const ui = UI[lang];
        await page.goto('/');
        await setLang(page, lang);
        await openUnit(page, unit, lang, 'learn');
        const n = bodyOf(unit.key).cards.length;
        for (let i = 0; i < n; i++) {
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(bodyOf(unit.key).cards[i]!.title[lang]);
          await expectNoOverflow(page, `${unit.key} card ${i + 1} ${lang}`);
          await expectNoCopyButtons(page);
          await expectCopyOnlyInTryIt(page);
          if (i < n - 1) await page.getByRole('button', { name: ui.next, exact: true }).click();
        }
      });

      test(`${unit.key}: every practice screen fits (${lang})`, async ({ page }) => {
        await page.goto('/');
        await setLang(page, lang);
        await openUnit(page, unit, lang, 'practice');
        for (const item of bodyOf(unit.key).items) {
          await expectNoOverflow(page, `${unit.key}/${item.id} ${lang}`);
          await expectNoCopyButtons(page);
          await answerItem(page, item, lang, true, (label) => expectNoOverflow(page, `${unit.key}/${label} ${lang}`));
        }
        await expect(page.getByRole('heading', { name: UI[lang].doneTitle })).toBeVisible();
        await expectNoOverflow(page, `${unit.key} done ${lang}`);
      });
    }
  }
});
