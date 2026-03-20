import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Access Control @access', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('アクセス管理ページ表示 @L1 @P2', async ({ page }) => {
    await page.goto('/access');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // Page should load without error
    // Either shows access management content or redirects
    const isOnAccess = page.url().includes('/access');
    const isOnBots = page.url().includes('/bots');

    expect(isOnAccess || isOnBots).toBeTruthy();
  });

  test('コラボレーティブスペース表示 @L1 @P2', async ({ page }) => {
    await page.goto('/collaborative');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    const isOnCollaborative = page.url().includes('/collaborative');
    const isOnBots = page.url().includes('/bots');

    expect(isOnCollaborative || isOnBots).toBeTruthy();
  });
});
