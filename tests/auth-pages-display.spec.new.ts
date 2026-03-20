import { test, expect } from '@playwright/test';

const baseUrl = 'https://admin-staging.gbase.ai';

test.describe('新規登録ページ @auth-register', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseUrl}/auth/register`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('ページ表示確認 @L1 @P2', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(
      page.getByRole('heading', { name: 'アカウントを作成' })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole('textbox', { name: '氏名' })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole('button', { name: '新規登録' })
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('パスワードリセットページ @auth-forgot-password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseUrl}/auth/forgot-password`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('ページ表示確認 @L1 @P2', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
    await expect(
      page.getByRole('heading', { name: 'パスワードをお忘れですか？' })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole('textbox', { name: 'メールアドレス' })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole('button', { name: 'リセットリンクを送信' })
    ).toBeVisible({ timeout: 10_000 });
  });
});
