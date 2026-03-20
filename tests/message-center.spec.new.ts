import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

const baseUrl = 'https://admin-staging.gbase.ai';

test.describe('メッセージセンター @message-center', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(baseUrl + '/message-center');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  });

  test('ページ表示確認 @L1 @P2', async ({ page }) => {
    await expect(page).toHaveURL(/\/message-center/, { timeout: 10_000 });
    await expect(page.getByText('メッセージセンター')).toBeVisible({ timeout: 10_000 });
  });

  test('招待なし状態またはリスト表示 @L1 @P2', async ({ page }) => {
    // Either show the "no invitations" message or a list of invitations
    const noInvitationsText = page.getByText('招待通知がありません');
    const acceptButton = page.getByRole('button', { name: '受け入れる' });

    // At least one of the two states should be present
    const hasNoInvitations = await noInvitationsText.isVisible().catch(() => false);
    const hasInvitations = await acceptButton.isVisible().catch(() => false);

    expect(hasNoInvitations || hasInvitations).toBeTruthy();
  });

  test('ページ離脱後もURLが正常 @L1 @P2', async ({ page }) => {
    await expect(page).toHaveURL(/\/message-center/);
    // Navigate away and back
    await page.goto(baseUrl + '/bots');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await page.goto(baseUrl + '/message-center');
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/message-center/);
    await expect(page.getByText('メッセージセンター')).toBeVisible({ timeout: 10_000 });
  });
});
