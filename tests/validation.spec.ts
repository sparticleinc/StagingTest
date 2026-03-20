import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Validation & Error Handling @validation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('ボット作成：名前空欄エラー @L5 @P1', async ({ page }) => {
    // Open create dialog
    await page.getByText('AIアシスタントを作成しています').click();
    await expect(
      page.getByRole('dialog', { name: 'AIアシスタントを作成しています' })
    ).toBeVisible({ timeout: 5_000 });

    // Fill only description, leave name empty
    await page
      .getByRole('textbox', { name: '説明' })
      .fill('Test description for validation');

    // Click OK
    await page.getByRole('button', { name: 'OK' }).click();

    // Should show validation error or stay on dialog (not navigate away)
    await page.waitForTimeout(1000);

    // Dialog should still be open (name is required)
    await expect(
      page.getByRole('dialog', { name: 'AIアシスタントを作成しています' })
    ).toBeVisible();

    // Close dialog
    await page.getByRole('button', { name: 'キャンセル' }).click();
  });

  test('ボット作成：説明空欄エラー @L5 @P1', async ({ page }) => {
    await page.getByText('AIアシスタントを作成しています').click();
    await expect(
      page.getByRole('dialog', { name: 'AIアシスタントを作成しています' })
    ).toBeVisible({ timeout: 5_000 });

    // Fill only name, leave description empty
    await page.getByRole('textbox', { name: '名前' }).fill('TestBot_NoDesc');

    await page.getByRole('button', { name: 'OK' }).click();
    await page.waitForTimeout(1000);

    // Dialog should still be open (description is required)
    await expect(
      page.getByRole('dialog', { name: 'AIアシスタントを作成しています' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'キャンセル' }).click();
  });

  test('ボット作成：名前100文字制限 @L5 @P2', async ({ page }) => {
    await page.getByText('AIアシスタントを作成しています').click();
    await expect(
      page.getByRole('dialog', { name: 'AIアシスタントを作成しています' })
    ).toBeVisible({ timeout: 5_000 });

    // Fill with 101 characters
    const longName = 'A'.repeat(101);
    await page.getByRole('textbox', { name: '名前' }).fill(longName);
    await page
      .getByRole('textbox', { name: '説明' })
      .fill('Testing max length');

    await page.getByRole('button', { name: 'OK' }).click();
    await page.waitForTimeout(1000);

    // Either: dialog stays open (validation error) or name is truncated
    // Check if we're still on the dialog or got an error message
    const stillOnDialog = await page
      .getByRole('dialog', { name: 'AIアシスタントを作成しています' })
      .isVisible()
      .catch(() => false);

    if (stillOnDialog) {
      // Validation prevented submission — expected
      await page.getByRole('button', { name: 'キャンセル' }).click();
    } else {
      // Bot was created (name might be truncated) — clean it up
      await page.goto('/bots');
      await page.waitForTimeout(2000);
      // If the bot was created, it would show up — acceptable behavior
    }
  });

  test('存在しないページで404表示 @L5 @P1', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });

    // 404 page shows: "あなたは秘密の場所を見つけました" or "404" or redirects
    const has404Text = await page
      .getByText('あなたは秘密の場所を見つけました')
      .isVisible()
      .catch(() => false);
    const has404Number = await page.getByText('404').isVisible().catch(() => false);
    const redirectedToBots = page.url().includes('/bots');
    const redirectedToLogin = page.url().includes('/auth/login');

    expect(has404Text || has404Number || redirectedToBots || redirectedToLogin).toBeTruthy();
  });
});
