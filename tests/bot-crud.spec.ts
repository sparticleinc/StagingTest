import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Bot CRUD @bot @crud', () => {
  const botName = `E2E_Bot_${Date.now()}`;
  const botDescription = 'Automated E2E test bot - safe to delete';

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('ボット作成→削除 @P0', async ({ page }) => {
    // ── Step 1: Open create bot dialog ──
    await page.getByText('AIアシスタントを作成しています').click();
    await expect(
      page.getByRole('dialog', { name: 'AIアシスタントを作成しています' })
    ).toBeVisible({ timeout: 5_000 });

    // ── Step 2: Fill bot details ──
    await page.getByRole('textbox', { name: '名前' }).fill(botName);
    await page.getByRole('textbox', { name: '説明' }).fill(botDescription);

    // ── Step 3: Submit creation ──
    await page.getByRole('button', { name: 'OK' }).click();

    // Should redirect to bot config page
    await page.waitForURL('**/create?botId=*', { timeout: 15_000 });

    // ── Step 4: Verify bot appears in list ──
    await page.goto('/bots');
    await expect(page.getByText('GBaseへようこそ')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText(botName).first()).toBeVisible({
      timeout: 10_000,
    });

    // ── Step 5: Open bot card menu ("..." button) ──
    // DOM: card > wrapper(e109) > [info-div(e110) has paragraph, button(e121)]
    // Use evaluate to find the button sibling within the same card wrapper
    const botNameLocator = page.getByText(botName, { exact: true }).first();

    // Hover to ensure menu button is visible
    await botNameLocator.hover();
    await page.waitForTimeout(500);

    // Click the "..." menu button using JavaScript to traverse the DOM reliably
    await botNameLocator.evaluate((el) => {
      // Go up from the text element until we find a container that also has a button
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

    // ── Step 6: Click delete in the dropdown menu ──
    await expect(page.getByRole('menuitem', { name: '削除' })).toBeVisible({
      timeout: 5_000,
    });
    await page.getByRole('menuitem', { name: '削除' }).click();

    // ── Step 7: Confirm deletion dialog ──
    // Dialog title: "チャットボットを削除する", body: "{name}を削除してもよろしいですか？"
    await expect(
      page.getByText('チャットボットを削除する')
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByText(`${botName}を削除してもよろしいですか？`)
    ).toBeVisible();

    // Click the red "削除" confirm button (not the "キャンセル")
    await page.getByRole('button', { name: '削除' }).last().click();

    // ── Step 8: Verify bot is removed from list ──
    await page.waitForTimeout(2000);
    await expect(page.getByText(botName)).not.toBeVisible({ timeout: 10_000 });
  });
});
