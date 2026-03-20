import { test, expect } from '@playwright/test';
import { login, navigateToBot } from './helpers/auth';

test.describe('Bot Settings @settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToBot(page, 'BDD_Test_Agent');
  });

  test('設定ページ各タブ表示 @L1 @P0', async ({ page }) => {
    // Navigate to settings via direct URL
    const botUrl = page.url();
    const botBase = botUrl.replace(/\/chat$/, '');
    await page.goto(`${botBase}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Verify settings page loaded
    await expect(page).toHaveURL(/\/settings/);

    // Tabs use role="tab" with text: 一般設定, 詳細設定, Canvas, プロンプト, ボット削除, 連携アプリ
    await expect(page.getByRole('tab', { name: '一般設定' })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole('tab', { name: '詳細設定' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'プロンプト' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'ボット削除' })).toBeVisible();
  });

  test('ボット名編集 @L3 @P1', async ({ page }) => {
    const botUrl = page.url();
    const botBase = botUrl.replace(/\/chat$/, '');
    await page.goto(`${botBase}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Find the bot name input by placeholder (skip the readonly bot ID field)
    const nameInput = page.getByPlaceholder('チャットボットの名前を入力してください');
    await expect(nameInput).toBeVisible({ timeout: 10_000 });

    // Verify input is editable by changing value
    const originalName = await nameInput.inputValue();
    const tempName = `E2E_Settings_${Date.now()}`;
    await nameInput.fill(tempName);
    await expect(nameInput).toHaveValue(tempName);

    // Revert to original name (don't save — just verify editability)
    await nameInput.fill(originalName);
    await expect(nameInput).toHaveValue(originalName);
  });

  test('危険ゾーン表示 @L1 @P1', async ({ page }) => {
    const botUrl = page.url();
    const botBase = botUrl.replace(/\/chat$/, '');
    // Navigate to settings danger zone section
    await page.goto(`${botBase}/settings#danger`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // The danger zone should show delete-related content
    await expect(
      page.getByText('削除').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
