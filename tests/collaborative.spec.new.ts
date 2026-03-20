import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const baseUrl = 'https://admin-staging.gbase.ai';

test.describe('コラボレーションスペース @collaborative', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(baseUrl + '/collaborative');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('ページ表示確認 @L1 @P2', async ({ page }) => {
    await expect(page).toHaveURL(/\/collaborative/, { timeout: 10_000 });
    await expect(page.getByText('コラボレーションスペース')).toBeVisible({ timeout: 10_000 });
  });

  test('タブ表示確認 @L1 @P2', async ({ page }) => {
    // Actual tabs on this page are チャットボット and ナレッジベース
    const chatbotTab = page.getByRole('tab', { name: 'チャットボット' });
    const knowledgeTab = page.getByRole('tab', { name: 'ナレッジベース' });

    await expect(chatbotTab).toBeVisible({ timeout: 10_000 });
    await expect(knowledgeTab).toBeVisible({ timeout: 10_000 });
  });

  test('タブ切替確認 @L2 @P2', async ({ page }) => {
    const chatbotTab = page.getByRole('tab', { name: 'チャットボット' });
    const knowledgeTab = page.getByRole('tab', { name: 'ナレッジベース' });

    await expect(chatbotTab).toBeVisible({ timeout: 10_000 });

    // Switch to ナレッジベース tab
    await knowledgeTab.click();
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(knowledgeTab).toHaveAttribute('aria-selected', 'true');

    // Switch back to チャットボット tab
    await chatbotTab.click();
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(chatbotTab).toHaveAttribute('aria-selected', 'true');
  });
});
