import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Dataset Management @dataset', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to datasets page
    await page.getByRole('link', { name: 'ナレッジベース' }).click();
    await expect(page).toHaveURL(/\/datasets/, { timeout: 10_000 });
  });

  test('データセット一覧表示 @L1 @P0', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'ナレッジベースの作成' })
    ).toBeVisible({ timeout: 10_000 });

    // Verify at least one dataset is shown
    await expect(page.getByText('ISMS').first()).toBeVisible();
  });

  test('データセット詳細ページ遷移 @L1 @P1', async ({ page }) => {
    // Use search to find the exact ISMS dataset
    const searchBox = page.getByRole('textbox', { name: 'ナレッジベース名を検索' });
    await searchBox.fill('ISMS');
    await page.waitForTimeout(1000);

    await page.getByText('ISMS', { exact: true }).first().click();
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Verify navigated into dataset detail (URL has /datasets/ + ID + optional sub-path)
    await expect(page).toHaveURL(/\/datasets\/.+/);
  });

  test('データソースタブ表示 @L1 @P1', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'ナレッジベース名を検索' });
    await searchBox.fill('ISMS');
    await page.waitForTimeout(1000);

    await page.getByText('ISMS', { exact: true }).first().click();
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Dataset detail page should show data source tabs
    const hasFileTab = await page
      .getByText('ファイルとドキュメント')
      .first()
      .isVisible()
      .catch(() => false);
    const hasWebsiteTab = await page
      .getByText('ウェブサイト')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasFileTab || hasWebsiteTab).toBeTruthy();
  });
});
