import { test, expect } from '@playwright/test';
import { login, navigateToBot } from './helpers/auth';

test.describe('タグ管理 @tag', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToBot(page, 'BDD_Test_Agent');
    // Navigate to the tag sub-page from the bot URL
    const botUrl = page.url();
    const botBase = botUrl.replace(/\/chat$/, '');
    await page.goto(`${botBase}/tag`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('タグ管理ページ表示確認 @L1 @P1', async ({ page }) => {
    await expect(page).toHaveURL(/\/tag/, { timeout: 10_000 });
    // Use getByRole('main') to avoid strict-mode violation with sidebar link
    await expect(page.getByRole('main').getByText('タグ管理')).toBeVisible({ timeout: 10_000 });
  });

  test('テーブルカラムヘッダー表示確認 @L1 @P1', async ({ page }) => {
    // Verify table column headers are present (use .first() to avoid strict mode violations)
    await expect(page.getByText('タググループ').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('タグ').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('編集時間').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('操作').first()).toBeVisible({ timeout: 10_000 });
  });

  test('タググループ作成ボタン表示確認 @L1 @P1', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'タググループを作成' })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('タググループ作成モーダル表示 @L2 @P1', async ({ page }) => {
    const createButton = page.getByRole('button', { name: 'タググループを作成' });
    await expect(createButton).toBeVisible({ timeout: 10_000 });
    await createButton.click();

    // Modal/dialog should appear
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Close the dialog by pressing Escape
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });
});
