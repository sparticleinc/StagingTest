import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Bot Workflow @workflow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('ボット作成→設定→チャット→削除 @L4 @P0', async ({ page }) => {
    const botName = `E2E_Workflow_${Date.now()}`;
    const botDesc = 'Workflow test bot - safe to delete';

    // ── Phase 1: Create bot ──
    await page.getByText('AIアシスタントを作成しています').click();
    await expect(
      page.getByRole('dialog', { name: 'AIアシスタントを作成しています' })
    ).toBeVisible({ timeout: 5_000 });

    await page.getByRole('textbox', { name: '名前' }).fill(botName);
    await page.getByRole('textbox', { name: '説明' }).fill(botDesc);
    await page.getByRole('button', { name: 'OK' }).click();

    await page.waitForURL('**/create?botId=*', { timeout: 15_000 });
    const createUrl = page.url();
    const botIdMatch = createUrl.match(/botId=([a-zA-Z0-9-]+)/);
    expect(botIdMatch).toBeTruthy();
    const botId = botIdMatch![1];

    // ── Phase 2: Visit settings page ──
    await page.goto(`/bot/${botId}/settings`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/settings/);

    // ── Phase 3: Visit chat page ──
    await page.goto(`/bot/${botId}/chat`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/chat/);

    // Verify chat input is present
    const chatInput = page.getByRole('textbox').first();
    await expect(chatInput).toBeVisible({ timeout: 10_000 });

    // ── Phase 4: Go back to bot list and delete ──
    await page.goto('/bots');
    await expect(page.getByText('GBaseへようこそ')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(botName).first()).toBeVisible({
      timeout: 10_000,
    });

    // Open menu for our bot
    const botNameLocator = page.getByText(botName, { exact: true }).first();
    await botNameLocator.hover();
    await page.waitForTimeout(500);

    await botNameLocator.evaluate((el) => {
      let container = el.parentElement;
      while (container) {
        const btn = container.querySelector('button');
        if (btn) {
          btn.click();
          return;
        }
        container = container.parentElement;
      }
    });

    // Delete
    await expect(
      page.getByRole('menuitem', { name: '削除' })
    ).toBeVisible({ timeout: 5_000 });
    await page.getByRole('menuitem', { name: '削除' }).click();

    await expect(
      page.getByText('チャットボットを削除する')
    ).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: '削除' }).last().click();

    // ── Phase 5: Verify cleanup ──
    await page.waitForTimeout(2000);
    await expect(page.getByText(botName)).not.toBeVisible({ timeout: 10_000 });
  });
});
