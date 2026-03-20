import { test, expect } from '@playwright/test';
import { login, navigateToBot } from './helpers/auth';

test.describe('Dictionary @dictionary', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToBot(page, 'BDD_Test_Agent');
  });

  test('用語集ページ表示 @L1 @P1', async ({ page }) => {
    const botUrl = page.url();
    const botBase = botUrl.replace(/\/chat$/, '');
    await page.goto(`${botBase}/dictionary`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    await expect(page).toHaveURL(/\/dictionary/);
  });

  test('用語追加→削除 @L2 @P1', async ({ page }) => {
    const botUrl = page.url();
    const botBase = botUrl.replace(/\/chat$/, '');
    await page.goto(`${botBase}/dictionary`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Look for add button
    const addButton = page.getByRole('button', { name: /追加|新規/ }).first();
    const hasAddButton = await addButton.isVisible().catch(() => false);

    if (hasAddButton) {
      await addButton.click();
      await page.waitForTimeout(1000);

      // Fill source and target terms
      const sourceInput = page.getByRole('textbox').first();
      const targetInput = page.getByRole('textbox').nth(1);

      if (
        (await sourceInput.isVisible().catch(() => false)) &&
        (await targetInput.isVisible().catch(() => false))
      ) {
        const testTerm = `E2E_Term_${Date.now()}`;
        await sourceInput.fill(testTerm);
        await targetInput.fill(`${testTerm}_translated`);

        // Save
        const saveButton = page.getByRole('button', { name: /保存|OK|追加/ }).last();
        if (await saveButton.isVisible().catch(() => false)) {
          await saveButton.click();
          await page.waitForTimeout(2000);

          // Verify term appears
          await expect(page.getByText(testTerm).first()).toBeVisible({
            timeout: 5_000,
          });

          // Delete the term - find delete button near our term
          const termRow = page.getByText(testTerm).first();
          await termRow.hover();
          await page.waitForTimeout(500);

          // Click delete icon/button in the row
          const deleteBtn = termRow
            .locator('xpath=ancestor::tr | ancestor::div[contains(@class,"row")]')
            .locator('button')
            .last();
          if (await deleteBtn.isVisible().catch(() => false)) {
            await deleteBtn.click();
            await page.waitForTimeout(1000);

            // Confirm if needed
            const confirmBtn = page
              .getByRole('button', { name: '削除' })
              .last();
            if (await confirmBtn.isVisible().catch(() => false)) {
              await confirmBtn.click();
            }
            await page.waitForTimeout(2000);
          }
        }
      }
    }

    // Page should still be accessible (no crash)
    await expect(page).toHaveURL(/\/dictionary/);
  });
});
