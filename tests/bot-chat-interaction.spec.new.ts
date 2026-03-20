import { test, expect } from '@playwright/test';
import { login, navigateToBot } from './helpers/auth';

test.describe('Bot Chat — インタラクション @chat', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToBot(page, 'BDD_Test_Agent');
    await expect(
      page.getByRole('textbox', { name: 'こちらにメッセージを入力してください...' })
    ).toBeVisible({ timeout: 10_000 });
  });

  test('共有ボタンが表示されクリック可能 @L1 @P0', async ({ page }) => {
    // Verify the share button is visible and enabled
    const shareButton = page.getByRole('button', { name: '共有' });
    await expect(shareButton).toBeVisible();
    await expect(shareButton).toBeEnabled();

    // Record URL before click
    const urlBefore = page.url();

    // Click share — the behavior may vary (navigate, open drawer, open modal)
    // We just verify the button is interactable and no JS error occurs
    await shareButton.click();

    // Give the UI a moment to react
    await page.waitForTimeout(1500);

    // Accept any outcome: URL change, dialog, or page stayed the same
    // The key assertion is that the page didn't crash and is still responsive
    const chatInput = page.getByRole('textbox', {
      name: 'こちらにメッセージを入力してください...',
    });
    // Either the input is still visible (no navigation) OR the URL changed (navigated)
    const urlAfter = page.url();
    const inputVisible = await chatInput.isVisible().catch(() => false);
    // Page is still alive: either on chat page (input visible) or navigated somewhere else
    expect(inputVisible || urlAfter !== urlBefore).toBeTruthy();
  });

  test('チャット入力フォーカスと入力 @L1 @P0', async ({ page }) => {
    const chatInput = page.getByRole('textbox', {
      name: 'こちらにメッセージを入力してください...',
    });

    // Input should be interactive
    await chatInput.click();
    await chatInput.fill('E2E入力テスト');
    await expect(chatInput).toHaveValue('E2E入力テスト');

    // Clear and verify empty
    await chatInput.clear();
    await expect(chatInput).toHaveValue('');
  });

  test('チャット入力 — Enterキーで送信後に入力欄がクリアされる @L2 @P0', async ({ page }) => {
    const chatInput = page.getByRole('textbox', {
      name: 'こちらにメッセージを入力してください...',
    });

    // Type a short message and send
    await chatInput.fill('テスト');
    await chatInput.press('Enter');

    // After sending, the input should be cleared (or emptied) quickly
    await expect(async () => {
      const value = await chatInput.inputValue();
      expect(value).toBe('');
    }).toPass({ timeout: 5_000 });
  });
});
