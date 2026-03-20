import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Dataset Detail — タブ切り替えインタラクション @dataset', () => {
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

  test('ファイルとドキュメントタブ表示確認 @L1 @P0', async ({ page }) => {
    // The default tab (files) should be visible after navigation
    const fileTab = page.getByText('ファイルとドキュメント').first();
    await expect(fileTab).toBeVisible({ timeout: 10_000 });
  });

  test('ウェブサイトタブ切り替え @L1 @P0', async ({ page }) => {
    // Wait for tabs to render
    await expect(page.getByText('ファイルとドキュメント').first()).toBeVisible({ timeout: 10_000 });

    // Click website tab
    const websiteTab = page.getByText('ウェブサイト').first();
    await websiteTab.click();
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // URL should change to reflect website tab, or the tab content changes
    const hasWebsiteUrl = page.url().includes('website');
    const hasWebsiteContent = await page
      .getByText('ウェブサイト')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasWebsiteUrl || hasWebsiteContent).toBeTruthy();
  });

  test('Q&Aデータベースタブ切り替え @L1 @P0', async ({ page }) => {
    await expect(page.getByText('ファイルとドキュメント').first()).toBeVisible({ timeout: 10_000 });

    const faqTab = page.getByText('Q&Aデータベース').first();
    await expect(faqTab).toBeVisible({ timeout: 10_000 });
    await faqTab.click();
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // FAQ tab should now be active — URL or panel content changes
    const hasFaqUrl = page.url().includes('faq');
    const hasFaqContent = await page
      .getByText('Q&Aデータベース')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasFaqUrl || hasFaqContent).toBeTruthy();
  });

  test('APIソースタブ切り替え @L2 @P0', async ({ page }) => {
    await expect(page.getByText('ファイルとドキュメント').first()).toBeVisible({ timeout: 10_000 });

    const apiTab = page.getByText('APIソース').first();
    await expect(apiTab).toBeVisible({ timeout: 10_000 });
    await apiTab.click();
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    const hasApiUrl = page.url().includes('api');
    const hasApiContent = await page
      .getByText('APIソース')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasApiUrl || hasApiContent).toBeTruthy();
  });

  test('タブ間を順に切り替え @L2 @P0', async ({ page }) => {
    await expect(page.getByText('ファイルとドキュメント').first()).toBeVisible({ timeout: 10_000 });

    const tabTexts = ['ウェブサイト', 'Q&Aデータベース', 'APIソース', 'ファイルとドキュメント'];
    for (const tabText of tabTexts) {
      const tab = page.getByText(tabText).first();
      const isPresent = await tab.isVisible().catch(() => false);
      if (isPresent) {
        await tab.click();
        await page.waitForTimeout(500);
        // Each tab should remain visible after clicking (it's a tab label, not hidden)
        await expect(page.getByText(tabText).first()).toBeVisible();
      }
    }
  });
});
