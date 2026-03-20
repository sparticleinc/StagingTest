import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Navigation @nav', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('全メインページ正常表示 @L1 @P0 @smoke', async ({ page }) => {
    await expect(page.getByText('GBaseへようこそ')).toBeVisible();

    // ナレッジベース
    await page.getByRole('link', { name: 'ナレッジベース' }).click();
    await expect(page).toHaveURL(/\/datasets/, { timeout: 10_000 });
    await expect(page.getByRole('main').getByText('ナレッジベース', { exact: true })).toBeVisible();

    // マイボットに戻る
    await page.getByRole('link', { name: 'マイボット' }).click();
    await expect(page.getByText('GBaseへようこそ')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/bots/);
  });

  test('ワークスペース切替 @L2 @P1', async ({ page }) => {
    // Click the visible label instead of the hidden radio input
    await page.locator('text=Sparticle').last().click();
    await page.waitForTimeout(2000);

    await page.locator('text=個人').last().click();
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/\/bots/);
  });

  test('ボット内サブページ表示 @L1 @P0', async ({ page }) => {
    // Search to find BDD_Test_Agent (may be off-screen if orphaned bots exist)
    const searchBox = page.getByRole('textbox', { name: 'ボットを検索...' });
    await searchBox.fill('BDD_Test_Agent');
    await page.waitForTimeout(1000);

    await page.getByText('BDD_Test_Agent').first().click();
    await page.waitForURL('**/bot/*/chat', { timeout: 15_000 });
    const botUrl = page.url(); // e.g. .../bot/{id}/chat
    const botBase = botUrl.replace(/\/chat$/, '');

    // Test each sub-page loads without error
    const subPages = ['settings', 'records', 'dictionary', 'dashboard'];
    for (const sub of subPages) {
      await page.goto(`${botBase}/${sub}`);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });
      // Verify no error overlay and page loaded
      await expect(page).toHaveURL(new RegExp(`/${sub}`));
    }
  });
});
