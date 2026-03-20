import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Dataset CRUD @dataset @crud', () => {
  const datasetName = `E2E_Dataset_${Date.now()}`;
  const datasetDescription = 'Automated E2E test dataset - safe to delete';

  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to datasets page
    await page.getByRole('link', { name: 'ナレッジベース' }).click();
    await expect(page).toHaveURL(/\/datasets/, { timeout: 10_000 });
    await expect(
      page.getByRole('button', { name: 'ナレッジベースの作成' })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('ナレッジベース作成→削除 @L2 @P0', async ({ page }) => {
    // ── Step 1: Open create dataset dialog ──
    await page.getByRole('button', { name: 'ナレッジベースの作成' }).click();

    // Wait for the dialog/form to appear
    await expect(page.getByText('ナレッジベースの作成').nth(1)).toBeVisible({ timeout: 5_000 });

    // ── Step 2: Fill dataset details ──
    // The dialog has: "ナレッジベース名" (input) and "ナレッジベースの説明" (textarea)
    // Scope inputs within the dialog to avoid matching the search box behind it
    const dialog = page.getByRole('dialog').first();
    const nameInput = dialog.getByRole('textbox').first();
    await nameInput.fill(datasetName);
    const descInput = dialog.getByRole('textbox').nth(1);
    await descInput.fill(datasetDescription);

    // ── Step 3: Submit creation ──
    await page.getByRole('button', { name: '送信する' }).click();

    // Wait for navigation to the new dataset detail page
    await page.waitForURL('**/datasets/**', { timeout: 15_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // ── Step 4: Go back to list and verify dataset appears ──
    await page.getByRole('link', { name: 'ナレッジベース' }).click();
    await expect(page).toHaveURL(/\/datasets/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Use search to find the created dataset
    const searchBox = page.getByRole('textbox', { name: 'ナレッジベース名を検索' });
    await searchBox.fill(datasetName);
    await page.waitForTimeout(1500);

    await expect(page.getByText(datasetName).first()).toBeVisible({
      timeout: 10_000,
    });

    // ── Step 5: Open dataset card menu ("..." button) ──
    const datasetNameLocator = page.getByText(datasetName, { exact: true }).first();

    // Hover to ensure menu button is visible
    await datasetNameLocator.hover();
    await page.waitForTimeout(500);

    // Click the "..." menu button using JavaScript to traverse the DOM reliably
    await datasetNameLocator.evaluate((el) => {
      let container = el.parentElement;
      while (container) {
        const btn = container.querySelector('button');
        if (btn) {
          btn.click();
          return;
        }
        container = container.parentElement;
      }
    });

    // ── Step 6: Click delete in the dropdown menu ──
    await expect(page.getByRole('menuitem', { name: '削除' })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('menuitem', { name: '削除' }).click();

    // ── Step 7: Confirm deletion dialog ──
    // Wait for confirmation dialog to appear
    await page.waitForTimeout(500);

    // Click the confirm delete button
    await page.getByRole('button', { name: '削除' }).last().click();

    // ── Step 8: Verify dataset is removed from list ──
    await page.waitForTimeout(2000);
    await expect(page.getByText(datasetName)).not.toBeVisible({ timeout: 10_000 });
  });
});
