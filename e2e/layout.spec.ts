import { expect, test } from '@playwright/test';
import { UI } from '../src/i18n/ui';
import { answerItem, expectCopyOnlyInTryIt, expectNoCopyButtons, bodyOf, expectNoOverflow, GUARD_WAIT, LANGS, openUnit, READY, selectAnswer, setLang, SOON, UNITS } from './helpers';

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
          const label = `${unit.key} card ${i + 1} ${lang}`;
          const tryIt = page.locator('[data-try]');
          if ((await tryIt.count()) > 0) {
            await tryIt.getByRole('tab', { name: ui.tabDesktop, exact: true }).click();
            await expectNoOverflow(page, `${label} (Desktop tab)`);
            await expectNoCopyButtons(page);
            await expectCopyOnlyInTryIt(page);
            await tryIt.getByRole('tab', { name: ui.tabTerminal, exact: true }).click();
          }
          const deep = page.locator('details').filter({ has: page.locator('summary', { hasText: ui.underTheHood }) });
          if ((await deep.count()) > 0) {
            await deep.locator('summary').click();
            await expect(deep).toHaveAttribute('open', '');
            await expectNoOverflow(page, `${label} (Under the hood open)`);
            await deep.locator('summary').click();
          }
          if (i < n - 1) await page.getByRole('button', { name: ui.next, exact: true }).click();
        }
      });

      if (unit.mode === 'boss') {
        test(`${unit.key}: the boss intro, every prompt and the recap fit (${lang})`, async ({ page }) => {
          const ui = UI[lang];
          const items = bodyOf(unit.key).items;
          // A long clock, so a slow runner can't hit the time-out recap; learn-practice covers time running out.
          await page.goto('/?bossSeconds=600');
          await setLang(page, lang);
          await openUnit(page, unit, lang, 'practice');
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(unit.title[lang]);
          await expectNoOverflow(page, `${unit.key} intro ${lang}`);
          await page.getByRole('button', { name: ui.bossStart, exact: true }).click();
          await expect(page.getByRole('timer')).toBeVisible();
          for (const item of items) {
            await expect(page.getByRole('heading', { level: 1 })).toContainText(item.prompt[lang]);
            await expectNoOverflow(page, `${unit.key}/${item.id} ${lang}`);
            await expectNoCopyButtons(page);
            // Say Yes to every prompt, so the recap shows each dangerous one's headline too.
            const dangerous = item.type === 'approve' && !item.accept.includes('yes');
            await page.waitForTimeout(GUARD_WAIT);
            await selectAnswer(page, item, lang, dangerous);
          }
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(ui.bossRecapTitle);
          await expect(page.getByRole('listitem')).toHaveCount(items.length);
          await expect(page.getByText(ui.breaking, { exact: true })).not.toHaveCount(0);
          await expectNoOverflow(page, `${unit.key} recap ${lang}`);
          await expectNoCopyButtons(page);
        });
        continue;
      }

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
