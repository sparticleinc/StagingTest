import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('API Keys @apikeys', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('APIキーページ表示 @L1 @P1', async ({ page }) => {
    await page.goto('/keys');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/keys/);

    // Verify page title or key elements
    await expect(
      page.getByText('APIキー').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('APIキー作成→削除 @L2 @P0', async ({ page }) => {
    await page.goto('/keys');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Click create button
    const createButton = page.getByRole('button', { name: /新規キーを作成|作成/ }).first();
    await expect(createButton).toBeVisible({ timeout: 10_000 });
    await createButton.click();

    // Wait for modal or new key to appear
    await page.waitForTimeout(2000);

    // If a dialog appears with the new key, close it
    const okButton = page.getByRole('button', { name: 'OK' });
    if (await okButton.isVisible().catch(() => false)) {
      await okButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify at least one API key row exists
    // Look for a delete button/icon in the table
    const deleteButtons = page.getByRole('button').filter({
      has: page.locator('svg, img'),
    });
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);

    // Click the last delete button (the one we just created)
    await deleteButtons.last().click();

    // Confirm deletion if dialog appears
    await page.waitForTimeout(1000);
    const confirmDelete = page.getByRole('button', { name: '削除' }).last();
    if (await confirmDelete.isVisible().catch(() => false)) {
      await confirmDelete.click();
    }

    await page.waitForTimeout(2000);
  });
});
