import { test, expect } from '@playwright/test';
import { login, navigateToBot } from './helpers/auth';

test.describe('タグ管理 — インタラクション @tag', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToBot(page, 'BDD_Test_Agent');
    const botUrl = page.url();
    const botBase = botUrl.replace(/\/chat$/, '');
    await page.goto(`${botBase}/tag`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('タググループ作成モーダルのフォームフィールド確認 @L2 @P1', async ({ page }) => {
    // Open the create modal
    const createButton = page.getByRole('button', { name: 'タググループを作成' });
    await expect(createButton).toBeVisible({ timeout: 10_000 });
    await createButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Verify that a text input field exists inside the modal
    const nameInput = dialog.getByRole('textbox').first();
    await expect(nameInput).toBeVisible({ timeout: 5_000 });

    // Type into the name field and verify the value
    await nameInput.fill('テスト用タグ');
    await expect(nameInput).toHaveValue('テスト用タグ');

    // Cancel by pressing Escape (do NOT submit to avoid creating data)
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test('モーダルの開閉を繰り返し確認 @L2 @P1', async ({ page }) => {
    const createButton = page.getByRole('button', { name: 'タググループを作成' });
    await expect(createButton).toBeVisible({ timeout: 10_000 });

    // Open → close → reopen to verify modal lifecycle
    for (let i = 0; i < 2; i++) {
      await createButton.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 10_000 });

      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    }
  });
});
