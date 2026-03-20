import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Bot Management @bot', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('ボット一覧表示 @L1 @P0 @smoke', async ({ page }) => {
    await expect(page.getByText('GBaseへようこそ')).toBeVisible();
    await expect(page.getByText('BDD_Test_Chatbot').first()).toBeVisible();
  });

  test('ボット検索 @L2 @P1', async ({ page }) => {
    const searchBox = page.getByRole('textbox', { name: 'ボットを検索...' });
    await searchBox.fill('BDD_Test');
    await page.waitForTimeout(1000);
    await expect(page.getByText('BDD_Test_Chatbot').first()).toBeVisible();
  });

  test('ボット詳細ページ遷移 @L1 @P0', async ({ page }) => {
    // Search to ensure BDD_Test_Agent is visible even with many bots
    const searchBox = page.getByRole('textbox', { name: 'ボットを検索...' });
    await searchBox.fill('BDD_Test_Agent');
    await page.waitForTimeout(1000);

    await page.getByText('BDD_Test_Agent').first().click();
    await expect(page).toHaveURL(/\/bot\/.*\/chat/, { timeout: 15_000 });
    await expect(
      page.getByRole('textbox', { name: 'こちらにメッセージを入力してください...' })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('ボット作成ボタン表示 @L1 @P1', async ({ page }) => {
    await expect(
      page.getByText('AIアシスタントを作成しています')
    ).toBeVisible();
  });
});
