import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Authentication @auth', () => {
  test('ログイン成功 @P0', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/bots/);
    await expect(page.getByText('GBaseへようこそ')).toBeVisible();
  });

  test('ログイン失敗（不正パスワード） @P1', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('textbox', { name: 'アカウント' }).fill('staging@sparticle.com');
    await page.getByRole('textbox', { name: 'パスワード' }).fill('wrong_password_123');
    await page.getByRole('button', { name: 'ログイン' }).click();

    // Should stay on login page
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('未ログインでリダイレクト @P1', async ({ page }) => {
    await page.goto('/bots');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10_000 });
  });
});
