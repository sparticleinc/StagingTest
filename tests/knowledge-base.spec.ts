import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Knowledge Base @kb', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: 'ナレッジベース' }).click();
    await expect(page).toHaveURL(/\/datasets/, { timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'ナレッジベースの作成' })).toBeVisible();
  });

  test('ナレッジベース一覧表示 @P0', async ({ page }) => {
    await expect(page.getByText('ISMS').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'ナレッジベースの作成' })
    ).toBeVisible();
  });

  test('ナレッジベース検索 @P1', async ({ page }) => {
    const searchBox = page.getByRole('textbox', {
      name: 'ナレッジベース名を検索',
    });
    await searchBox.fill('ISMS');
    await page.waitForTimeout(1000);
    await expect(page.getByText('ISMS').first()).toBeVisible();
  });
});
