import { test, expect } from '@playwright/test';
import { login, navigateToBot } from './helpers/auth';

test.describe('Bot Settings — タブ切り替えインタラクション @settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToBot(page, 'BDD_Test_Agent');

    // Navigate to settings page
    const botUrl = page.url();
    const botBase = botUrl.replace(/\/chat$/, '');
    await page.goto(`${botBase}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole('tab', { name: '一般設定' })).toBeVisible({ timeout: 10_000 });
  });

  test('詳細設定タブ切り替え @L1 @P0', async ({ page }) => {
    // Start on 一般設定 (default)
    const generalTab = page.getByRole('tab', { name: '一般設定' });
    await expect(generalTab).toHaveAttribute('aria-selected', 'true');

    // Click 詳細設定 tab
    const advancedTab = page.getByRole('tab', { name: '詳細設定' });
    await advancedTab.click();
    await expect(advancedTab).toHaveAttribute('aria-selected', 'true');
    await expect(generalTab).toHaveAttribute('aria-selected', 'false');
  });

  test('プロンプトタブ切り替え @L1 @P0', async ({ page }) => {
    const promptTab = page.getByRole('tab', { name: 'プロンプト' });
    await promptTab.click();
    await expect(promptTab).toHaveAttribute('aria-selected', 'true');

    // Prompt panel should have a text area / input for the system prompt
    // Content varies but the tab panel itself must become active
    const tabpanel = page.getByRole('tabpanel');
    await expect(tabpanel).toBeVisible({ timeout: 5_000 });
  });

  test('ボット削除タブ切り替え @L1 @P0', async ({ page }) => {
    const deleteTab = page.getByRole('tab', { name: 'ボット削除' });
    await deleteTab.click();
    await expect(deleteTab).toHaveAttribute('aria-selected', 'true');

    // The delete tab panel should show delete-related content
    const tabpanel = page.getByRole('tabpanel');
    await expect(tabpanel).toBeVisible({ timeout: 5_000 });
    await expect(tabpanel.getByText('削除').first()).toBeVisible();
  });

  test('タブ間を順に切り替え @L2 @P0', async ({ page }) => {
    const tabs = [
      page.getByRole('tab', { name: '一般設定' }),
      page.getByRole('tab', { name: '詳細設定' }),
      page.getByRole('tab', { name: 'プロンプト' }),
      page.getByRole('tab', { name: 'ボット削除' }),
    ];

    for (const tab of tabs) {
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      // Brief settle
      await page.waitForTimeout(300);
    }
  });
});
