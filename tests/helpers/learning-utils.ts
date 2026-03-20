import { Page } from '@playwright/test';

export interface LearningPollOptions {
  /** Maximum time to wait in ms. Default: 120_000 (2 min) */
  timeout?: number;
  /** Interval between polls in ms. Default: 10_000 (10 sec) */
  interval?: number;
}

/**
 * Poll the dataset detail page for the '学習済み' status indicator.
 * Each iteration reloads the page and checks for the text.
 *
 * @returns 'completed' if '学習済み' appears, 'timeout' if deadline exceeded.
 */
export async function waitForLearningComplete(
  page: Page,
  options?: LearningPollOptions
): Promise<'completed' | 'timeout'> {
  const timeout = options?.timeout ?? 120_000;
  const interval = options?.interval ?? 10_000;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const isLearned = await page.getByText('学習済み').isVisible().catch(() => false);
    if (isLearned) return 'completed';

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await page.waitForTimeout(Math.min(interval, remaining));
  }

  return 'timeout';
}
