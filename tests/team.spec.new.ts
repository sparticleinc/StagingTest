import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const baseUrl = 'https://admin-staging.gbase.ai';

test.describe('チームページ @team', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(baseUrl + '/team');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('チームページ表示確認 @L1 @P1', async ({ page }) => {
    await expect(page).toHaveURL(/\/team/, { timeout: 10_000 });
    // Stub page shows "TeamPage" placeholder text
    await expect(page.getByText('TeamPage')).toBeVisible({ timeout: 10_000 });
  });
});
