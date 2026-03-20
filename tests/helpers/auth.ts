import { Page, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL || 'staging@sparticle.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'sparticle12345@';

/**
 * Login to GBase Admin and wait for the bots page to load.
 */
export async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByRole('textbox', { name: 'アカウント' }).fill(TEST_EMAIL);
  await page.getByRole('textbox', { name: 'パスワード' }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL('**/bots', { timeout: 15_000 });
  await expect(page.getByText('GBaseへようこそ')).toBeVisible({ timeout: 10_000 });
}

/**
 * Navigate into a specific bot by clicking its card on the bots page.
 * Uses the search box to filter bots, ensuring the target is visible
 * even when many bots exist (e.g. orphaned E2E bots pushing it off-screen).
 */
export async function navigateToBot(page: Page, botName: string) {
  await page.goto('/bots');
  await expect(page.getByText('GBaseへようこそ')).toBeVisible({ timeout: 10_000 });

  // Use search box to filter — guarantees target bot is visible
  const searchBox = page.getByRole('textbox', { name: 'ボットを検索...' });
  await searchBox.fill(botName);
  await page.waitForTimeout(1000);

  // Click the bot card
  const botCard = page.getByText(botName, { exact: true }).first();
  await botCard.scrollIntoViewIfNeeded();
  await botCard.click();
  await page.waitForURL('**/bot/*/chat', { timeout: 15_000 });
}

/**
 * Click a sidebar link inside a bot's detail page.
 */
export async function clickBotSidebar(page: Page, linkName: string) {
  await page.getByRole('link', { name: linkName }).click();
  await page.waitForTimeout(1000);
}
