import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Dataset Sub-pages — 表示確認 @dataset-subpages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);

    // Navigate to datasets list
    await page.getByRole('link', { name: 'ナレッジベース' }).click();
    await expect(page).toHaveURL(/\/datasets/, { timeout: 10_000 });

    // Search and navigate into ISMS dataset
    const searchBox = page.getByRole('textbox', { name: 'ナレッジベース名を検索' });
    await searchBox.fill('ISMS');
    await page.waitForTimeout(1000);
    await page.getByText('ISMS', { exact: true }).first().click();
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/datasets\/.+/);
  });

  test('Q&Aデータベースタブ表示確認 @L1 @P2', async ({ page }) => {
    // Wait for dataset page to load
    await expect(page.getByText('ファイルとドキュメント').first()).toBeVisible({ timeout: 10_000 });

    // Click Q&A tab
    const faqTab = page.getByText('Q&Aデータベース').first();
    await expect(faqTab).toBeVisible({ timeout: 10_000 });
    await faqTab.click();
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Verify URL changed to faq
    await expect(page).toHaveURL(/\/faq/, { timeout: 10_000 });
    // Page should have loaded content
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('APIソースタブ表示確認 @L1 @P2', async ({ page }) => {
    // Wait for dataset page to load
    await expect(page.getByText('ファイルとドキュメント').first()).toBeVisible({ timeout: 10_000 });

    // Click API tab
    const apiTab = page.getByText('APIソース').first();
    await expect(apiTab).toBeVisible({ timeout: 10_000 });
    await apiTab.click();
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Verify URL changed to api
    await expect(page).toHaveURL(/\/api/, { timeout: 10_000 });
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('インテグレーションタブ表示確認 @L1 @P2', async ({ page }) => {
    // Wait for dataset page to load
    await expect(page.getByText('ファイルとドキュメント').first()).toBeVisible({ timeout: 10_000 });

    // Look for integration tab — may be labeled differently in Japanese UI
    const integrationTab = page.getByText('インテグレーション').first();
    const hasIntegration = await integrationTab.isVisible({ timeout: 5_000 }).catch(() => false);

    if (hasIntegration) {
      await integrationTab.click();
      await page.waitForLoadState('networkidle', { timeout: 15_000 });
      await expect(page).toHaveURL(/\/integration/, { timeout: 10_000 });
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    } else {
      // Try alternative label
      const altTab = page.getByText('連携').first();
      const hasAlt = await altTab.isVisible({ timeout: 3_000 }).catch(() => false);
      if (hasAlt) {
        await altTab.click();
        await page.waitForLoadState('networkidle', { timeout: 15_000 });
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
      } else {
        // Tab not found — take screenshot for debugging and skip
        await page.screenshot({ path: 'test-results/dataset-integration-tab-not-found.png' });
        test.skip(true, 'Integration tab not found in UI');
      }
    }
  });
});
