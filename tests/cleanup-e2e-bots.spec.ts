/**
 * Cleanup script: Delete any orphaned E2E_Bot_* bots left from failed test runs.
 * Run manually: npx playwright test tests/cleanup-e2e-bots.spec.ts --headed
 */
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test('Cleanup orphaned E2E bots', async ({ page }) => {
  await login(page);
  await expect(page.getByText('GBaseへようこそ')).toBeVisible({ timeout: 10_000 });

  // Keep deleting E2E_Bot_ entries until none remain
  let maxIterations = 20; // safety limit
  while (maxIterations-- > 0) {
    const botCard = page.getByText(/^E2E_Bot_\d+$/).first();
    const isVisible = await botCard.isVisible().catch(() => false);
    if (!isVisible) break;

    const botName = await botCard.textContent();
    console.log(`Deleting orphaned bot: ${botName}`);

    // Hover + click menu
    await botCard.hover();
    await page.waitForTimeout(500);
    await botCard.evaluate((el) => {
      let container = el.parentElement;
      while (container) {
        const btn = container.querySelector('button');
        if (btn) { btn.click(); return; }
        container = container.parentElement;
      }
    });

    // Click 削除 menu item
    await page.getByRole('menuitem', { name: '削除' }).click();

    // Confirm deletion
    await expect(page.getByText('チャットボットを削除する')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: '削除' }).last().click();
    await page.waitForTimeout(2000);
  }

  // Verify no E2E bots remain
  const remaining = await page.getByText(/^E2E_Bot_\d+$/).count();
  console.log(`Cleanup complete. Remaining E2E bots: ${remaining}`);
  expect(remaining).toBe(0);
});
