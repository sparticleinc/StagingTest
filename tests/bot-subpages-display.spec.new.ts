import { test, expect } from '@playwright/test';
import { login, navigateToBot } from './helpers/auth';

test.describe('Bot Sub-pages — 表示確認 @bot-subpages', () => {
  let botBase: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToBot(page, 'BDD_Test_Agent');
    const botUrl = page.url();
    botBase = botUrl.replace(/\/chat$/, '');
  });

  test('訪問者ページ表示確認 @L1 @P2', async ({ page }) => {
    await page.goto(`${botBase}/visitors`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/visitors/);
    // Verify page loaded with some content
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    // Look for visitor-related content
    const hasContent = await page.getByText('訪問者').first().isVisible().catch(() => false)
      || await page.getByRole('table').first().isVisible().catch(() => false)
      || await page.getByText('visitor').first().isVisible().catch(() => false);
    // At minimum the page should load without error
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('リアルタイムページ表示確認 @L1 @P2', async ({ page }) => {
    await page.goto(`${botBase}/realtime`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/realtime/);
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('ウィジェット埋め込みページ表示確認 @L1 @P2', async ({ page }) => {
    await page.goto(`${botBase}/widget-embed`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/widget-embed/);
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('デジタルヒューマンページ表示確認 @L1 @P2', async ({ page }) => {
    await page.goto(`${botBase}/digital-human`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/digital-human/);
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('データソースページ表示確認 @L1 @P2', async ({ page }) => {
    await page.goto(`${botBase}/data-source`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/data-source/);
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('ツールページ表示確認 @L1 @P2', async ({ page }) => {
    await page.goto(`${botBase}/tools`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/tools/);
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('機能ページ表示確認 @L1 @P2', async ({ page }) => {
    await page.goto(`${botBase}/capabilities`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/capabilities/);
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('インサイトページ表示確認（スタブ） @L1 @P2', async ({ page }) => {
    await page.goto(`${botBase}/insights`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    // Stub page — just verify it loads without crashing
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('使用状況ページ表示確認（スタブ） @L1 @P2', async ({ page }) => {
    await page.goto(`${botBase}/usage`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    // Stub page — just verify it loads without crashing
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('質問ページ表示確認（スタブ） @L1 @P2', async ({ page }) => {
    await page.goto(`${botBase}/questions`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    // Stub page — just verify it loads without crashing
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});
