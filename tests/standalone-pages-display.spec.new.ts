import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const baseUrl = 'https://admin-staging.gbase.ai';

test.describe('ボット作成ページ @create', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseUrl}/create`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('ページ表示確認 @L1 @P2', async ({ page }) => {
    await expect(page).toHaveURL(/\/create/);
    await expect(
      page.getByRole('heading', { name: '新しいチャットボットの作成' })
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('企業内協同管理ページ @org-collaboration-internal', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseUrl}/org-collaboration/internal`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('ページ表示確認 @L1 @P2', async ({ page }) => {
    await expect(page).toHaveURL(/\/org-collaboration\/internal/);
    await expect(
      page.getByText('企業内協同管理').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('企業外協同管理ページ @org-collaboration-external', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseUrl}/org-collaboration/external`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('ページ表示確認 @L1 @P2', async ({ page }) => {
    await expect(page).toHaveURL(/\/org-collaboration\/external/);
    await expect(
      page.getByText('企業外協同管理').first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('アカウントセンターページ @account', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseUrl}/account`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('ページ表示確認 @L1 @P2', async ({ page }) => {
    await expect(page).toHaveURL(/\/account/);
    await expect(
      page.getByRole('heading', { name: '個人センター' })
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('管理コンソールページ @admin-console', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseUrl}/admin-console`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('ページ表示確認 @L1 @P2', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin-console/);
    await expect(
      page.getByRole('heading', { name: '従業員管理' })
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('アクセス拒否ページ @no-access', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${baseUrl}/no-access`);
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('ページ表示確認 @L1 @P2', async ({ page }) => {
    await expect(page).toHaveURL(/\/no-access/);
    await expect(
      page.getByRole('alert').getByText('アクセス拒否')
    ).toBeVisible({ timeout: 10_000 });
  });
});
