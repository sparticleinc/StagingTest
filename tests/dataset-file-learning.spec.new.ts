import { test, expect } from '@playwright/test';
import { login, navigateToBot, clickBotSidebar } from './helpers/auth';
import { generateTestDoc, cleanupTestDocs, type GeneratedDoc } from './helpers/test-doc-generator';
import { waitForLearningComplete } from './helpers/learning-utils';

const FILE_FORMATS = ['txt', 'md', 'csv', 'html', 'pdf', 'docx', 'xlsx'];

test.describe('ファイル学習 @dataset @learning', () => {
  let datasetName: string;
  let datasetCreated = false;
  let datasetLinked = false;

  test.afterEach(async ({ page }) => {
    // Conditional cleanup — best-effort
    if (datasetLinked) {
      try {
        await navigateToBot(page, 'BDD_Test_Agent');
        // Navigate to data-source page via direct URL (関連ナレッジベース)
        const botUrl = page.url();
        const botBase = botUrl.replace(/\/chat$/, '');
        await page.goto(`${botBase}/data-source`);
        await page.waitForLoadState('networkidle', { timeout: 10_000 });

        // Find the linked dataset and unlink it
        const datasetItem = page.getByText(datasetName, { exact: true }).first();
        const isVisible = await datasetItem.isVisible().catch(() => false);
        if (isVisible) {
          // Hover to reveal action buttons, then click the delete/unlink button
          await datasetItem.hover();
          await page.waitForTimeout(500);
          // Look for the delete button within the dataset's row/card
          await datasetItem.evaluate((el) => {
            let container = el.closest('li') || el.closest('[class*="item"]') || el.parentElement;
            while (container) {
              const btn = container.querySelector('button');
              if (btn) { btn.click(); return; }
              container = container.parentElement;
            }
          });
          await page.waitForTimeout(500);
          // Confirm unlink if a confirmation dialog appears
          const confirmBtn = page.getByRole('button', { name: '削除' });
          if (await confirmBtn.isVisible().catch(() => false)) {
            await confirmBtn.last().click();
            await page.waitForTimeout(2000);
          }
        }
      } catch { /* best-effort */ }
    }

    if (datasetCreated) {
      try {
        await page.getByRole('link', { name: 'ナレッジベース' }).click();
        await expect(page).toHaveURL(/\/datasets/, { timeout: 10_000 });
        const searchBox = page.getByRole('textbox', { name: 'ナレッジベース名を検索' });
        await searchBox.fill(datasetName);
        await page.waitForTimeout(1500);
        const nameLocator = page.getByText(datasetName, { exact: true }).first();
        await nameLocator.hover();
        await page.waitForTimeout(500);
        await nameLocator.evaluate((el) => {
          let container = el.parentElement;
          while (container) {
            const btn = container.querySelector('button');
            if (btn) { btn.click(); return; }
            container = container.parentElement;
          }
        });
        await page.getByRole('menuitem', { name: '削除' }).click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: '削除' }).last().click();
        await page.waitForTimeout(2000);
      } catch { /* best-effort */ }
    }

    cleanupTestDocs();
    datasetCreated = false;
    datasetLinked = false;
  });

  for (const format of FILE_FORMATS) {
    test(`${format}ファイルの学習→Q&A検証 @L3 @P0`, async ({ page }) => {
      test.setTimeout(240_000);

      // Step 1: Generate test document
      const doc = await generateTestDoc(format);

      // Step 2: Login and create dataset
      await login(page);
      datasetName = `E2E_Learning_${Date.now()}_${format}`;

      await page.getByRole('link', { name: 'ナレッジベース' }).click();
      await expect(page).toHaveURL(/\/datasets/, { timeout: 10_000 });
      await page.getByRole('button', { name: 'ナレッジベースの作成' }).click();
      await expect(page.getByText('ナレッジベースの作成').nth(1)).toBeVisible({ timeout: 5_000 });

      const dialog = page.getByRole('dialog').first();
      await dialog.getByRole('textbox').first().fill(datasetName);
      await dialog.getByRole('textbox').nth(1).fill('Automated file learning test - safe to delete');
      await page.getByRole('button', { name: '送信する' }).click();

      await page.waitForURL('**/datasets/**', { timeout: 15_000 });
      await page.waitForLoadState('networkidle', { timeout: 15_000 });
      datasetCreated = true;

      // Step 3: Upload file via データソースを追加 dialog
      await page.getByRole('button', { name: 'データソースを追加' }).click();
      await expect(page.getByText('データソースを追加').nth(1)).toBeVisible({ timeout: 5_000 });

      // The ドキュメント tab is selected by default
      // The file input is hidden behind a Mantine Dropzone overlay,
      // so we use setInputFiles directly on the input[type="file"] element
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(doc.filePath);

      // Wait for file to appear in the upload list
      await page.waitForTimeout(3000);
      const startLearningBtn = page.getByRole('button', { name: '学習を開始する' });
      await expect(startLearningBtn).toBeEnabled({ timeout: 10_000 });
      await startLearningBtn.click();

      // Wait for dialog to close and return to dataset detail
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle', { timeout: 15_000 });

      // Step 4: Poll learning status
      const learningResult = await waitForLearningComplete(page);
      if (learningResult === 'timeout') {
        test.info().annotations.push({
          type: 'soft-fail',
          description: '学習未完了のため失敗の可能性あり',
        });
      }

      // Step 5: Link dataset to bot
      await navigateToBot(page, 'BDD_Test_Agent');
      // Navigate to data-source page
      const botUrl = page.url();
      const botBase = botUrl.replace(/\/chat$/, '');
      await page.goto(`${botBase}/data-source`);
      await page.waitForLoadState('networkidle', { timeout: 10_000 });

      // Click ナレッジベースを追加 to open the link dialog
      await page.getByRole('button', { name: 'ナレッジベースを追加' }).click();
      await expect(
        page.getByRole('heading', { name: '参照ナレッジベースを選択する' })
      ).toBeVisible({ timeout: 5_000 });

      // Search for the dataset by name
      const kbSearchBox = page.getByRole('textbox', { name: 'ナレッジベース名を検索' });
      await kbSearchBox.fill(datasetName);
      await page.waitForTimeout(1500);

      // Click the checkbox for the matching dataset in the list
      const datasetListItem = page.getByRole('listitem').filter({ hasText: datasetName }).first();
      await expect(datasetListItem).toBeVisible({ timeout: 5_000 });
      await datasetListItem.getByRole('checkbox').click();

      // Confirm adding
      const addButton = page.getByRole('button', { name: '追加' });
      await expect(addButton).toBeEnabled({ timeout: 3_000 });
      await addButton.click();

      // Wait for the dialog to close and the dataset to appear in the linked list
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle', { timeout: 10_000 });
      datasetLinked = true;

      // Step 6: Q&A verification
      await clickBotSidebar(page, 'チャット');
      await page.waitForLoadState('networkidle', { timeout: 10_000 });

      const chatInput = page.getByRole('textbox', {
        name: 'こちらにメッセージを入力してください...',
      });
      await expect(chatInput).toBeVisible({ timeout: 10_000 });

      // Send verification question
      await chatInput.fill(doc.verificationQ);
      await chatInput.press('Enter');

      // Wait for response containing expected answer (timeout: 30s)
      await expect(async () => {
        const chatArea = page.locator('main');
        const chatText = await chatArea.textContent();
        expect(chatText).toContain(doc.expectedA);
      }).toPass({ timeout: 30_000, intervals: [2_000] });
    });
  }
});
