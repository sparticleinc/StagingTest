import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Bot List — インタラクション @bot', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // login() lands on /bots automatically
    await expect(page.getByText('GBaseへようこそ')).toBeVisible({ timeout: 10_000 });
  });

  test('作成ダイアログ表示 @L2 @P0', async ({ page }) => {
    // Click the create bot button
    await page.getByText('AIアシスタントを作成しています').click();

    // Verify dialog opens
    const dialog = page.getByRole('dialog', { name: 'AIアシスタントを作成しています' });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Verify name and description inputs are present inside dialog
    await expect(dialog.getByRole('textbox', { name: '名前' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: '説明' })).toBeVisible();

    // Verify OK and cancel buttons exist
    await expect(dialog.getByRole('button', { name: 'OK' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'キャンセル' })).toBeVisible();
  });

  test('作成ダイアログ — キャンセルで閉じる @L2 @P0', async ({ page }) => {
    // Open dialog
    await page.getByText('AIアシスタントを作成しています').click();
    const dialog = page.getByRole('dialog', { name: 'AIアシスタントを作成しています' });
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Fill name to verify form is interactive
    await dialog.getByRole('textbox', { name: '名前' }).fill('E2E_Cancel_Test');

    // Click cancel — dialog should close, bots list still visible
    await dialog.getByRole('button', { name: 'キャンセル' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('GBaseへようこそ')).toBeVisible();
  });

  test('検索フィルタリング — 存在しない名前で空結果 @L2 @P0', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'ボットを検索...' });
    // Search for a string that should match no bots
    await searchBox.fill('ZZZNOMATCHZZZ_E2E');
    await page.waitForTimeout(1000);

    // BDD_Test_Agent should NOT be visible
    await expect(page.getByText('BDD_Test_Agent', { exact: true })).not.toBeVisible();
  });

  test('検索クリア後に一覧に戻る @L2 @P0', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'ボットを検索...' });

    // Filter to narrow results
    await searchBox.fill('BDD_Test');
    await page.waitForTimeout(1000);
    await expect(page.getByText('BDD_Test_Chatbot').first()).toBeVisible();

    // Clear search
    await searchBox.clear();
    await page.waitForTimeout(1000);

    // Page header should still be visible (list restored)
    await expect(page.getByText('GBaseへようこそ')).toBeVisible();
  });
});
