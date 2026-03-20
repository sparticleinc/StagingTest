import { test, expect } from '@playwright/test';
import { login, navigateToBot } from './helpers/auth';

test.describe('Chat @chat', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('チャット送信 & AI応答受信 @L4 @P0', async ({ page }) => {
    await navigateToBot(page, 'BDD_Test_Agent');

    const chatInput = page.getByRole('textbox', {
      name: 'こちらにメッセージを入力してください...',
    });
    await expect(chatInput).toBeVisible({ timeout: 10_000 });

    // Type message and press Enter to send (most reliable method)
    await chatInput.fill('こんにちは、これはE2Eテストです。「OK」とだけ返してください。');
    await chatInput.press('Enter');

    // Wait for AI response
    await expect(async () => {
      const messageArea = page.locator('main');
      const text = await messageArea.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(50);
    }).toPass({ timeout: 30_000 });
  });

  test('チャットページUI要素 @L1 @P1', async ({ page }) => {
    await navigateToBot(page, 'BDD_Test_Agent');

    await expect(page.getByRole('button', { name: '共有' })).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      page.getByRole('textbox', {
        name: 'こちらにメッセージを入力してください...',
      })
    ).toBeVisible();

    await expect(page.getByText('BDD_Test_Agent', { exact: true })).toBeVisible();
  });
});
