# File Upload & Learning E2E Tests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build E2E tests that auto-generate documents in 7 formats, upload them to GBase knowledge bases, verify learning completes, and validate knowledge retrieval via chatbot Q&A.

**Architecture:** A `test-doc-generator.ts` helper generates files at runtime with fixed Q&A content + random timestamps. A `learning-utils.ts` helper polls for learning completion with timeout degradation. The test file iterates over 7 formats, each running the full create→upload→learn→Q&A→cleanup cycle.

**Tech Stack:** Playwright, pdfkit + @types/pdfkit (PDF), docx (DOCX), exceljs (XLSX)

**Spec:** `docs/superpowers/specs/2026-03-20-file-learning-tests-design.md`

---

## File Structure

```
tests/
├── helpers/
│   ├── auth.ts                          # EXISTS — login, navigateToBot, clickBotSidebar
│   ├── test-doc-generator.ts            # CREATE — generates 7 file formats
│   └── learning-utils.ts                # CREATE — waitForLearningComplete polling
├── dataset-file-learning.spec.new.ts    # CREATE — 7 test cases (one per format)

package.json                             # MODIFY — add devDependencies
.github/workflows/e2e-tests.yml         # MODIFY — increase e2e-new timeout
```

---

### Task 1: Install npm dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the 4 new packages**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
npm install --save-dev pdfkit @types/pdfkit docx exceljs
```

- [ ] **Step 2: Verify installation**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
node -e "require('pdfkit'); require('docx'); require('exceljs'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
git add package.json package-lock.json
git commit -m "feat: add pdfkit, docx, exceljs for file learning tests"
```

---

### Task 2: Build the test document generator

**Files:**
- Create: `tests/helpers/test-doc-generator.ts`

- [ ] **Step 1: Create the complete generator file**

Create `tests/helpers/test-doc-generator.ts` with the complete content below. This is the full file — write it in one go:

```typescript
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface GeneratedDoc {
  filePath: string;
  fileName: string;
  format: string;
  verificationQ: string;
  expectedA: string;
}

const VERIFICATION_CONTENT = `GBase E2E Test Company was founded in 2020.
The CEO is Tanaka Taro.
Annual revenue is 500 million yen.
The headquarters is located in Shibuya, Tokyo.`;

const VERIFICATION_Q = 'GBase E2E Test Companyの設立年は？';
const EXPECTED_A = '2020';

// Track generated files for cleanup
const generatedFiles: string[] = [];

function isolationContent(format: string): string {
  const ts = Date.now();
  return `Test ID: E2E_Learning_${ts}_${format}\nGenerated at: ${new Date().toISOString()}\nThis document is for automated E2E testing purposes only.`;
}

function fullContent(format: string): string {
  return `${VERIFICATION_CONTENT}\n\n${isolationContent(format)}`;
}

function writeTempFile(fileName: string, content: string | Buffer): string {
  const filePath = path.join(os.tmpdir(), fileName);
  fs.writeFileSync(filePath, content);
  generatedFiles.push(filePath);
  return filePath;
}

function makeResult(filePath: string, fileName: string, format: string): GeneratedDoc {
  return { filePath, fileName, format, verificationQ: VERIFICATION_Q, expectedA: EXPECTED_A };
}

// ── Text-based generators (no external deps) ──

function generateTxt(): GeneratedDoc {
  const fileName = `E2E_Learning_${Date.now()}.txt`;
  const filePath = writeTempFile(fileName, fullContent('txt'));
  return makeResult(filePath, fileName, 'txt');
}

function generateMd(): GeneratedDoc {
  const fileName = `E2E_Learning_${Date.now()}.md`;
  const content = `# E2E Test Document\n\n${VERIFICATION_CONTENT}\n\n---\n\n${isolationContent('md')}`;
  const filePath = writeTempFile(fileName, content);
  return makeResult(filePath, fileName, 'md');
}

function generateCsv(): GeneratedDoc {
  const fileName = `E2E_Learning_${Date.now()}.csv`;
  const rows = [
    'field,value',
    '"company_name","GBase E2E Test Company"',
    '"founded","2020"',
    '"ceo","Tanaka Taro"',
    '"revenue","500 million yen"',
    '"headquarters","Shibuya, Tokyo"',
    `"test_id","E2E_Learning_${Date.now()}_csv"`,
  ];
  const filePath = writeTempFile(fileName, rows.join('\n'));
  return makeResult(filePath, fileName, 'csv');
}

function generateHtml(): GeneratedDoc {
  const fileName = `E2E_Learning_${Date.now()}.html`;
  const content = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>E2E Test Document</title></head>
<body>
<h1>E2E Test Document</h1>
<p>${VERIFICATION_CONTENT.replace(/\n/g, '</p>\n<p>')}</p>
<footer>${isolationContent('html').replace(/\n/g, '<br>')}</footer>
</body>
</html>`;
  const filePath = writeTempFile(fileName, content);
  return makeResult(filePath, fileName, 'html');
}

// ── Binary generators (require npm packages) ──

async function generatePdf(): Promise<GeneratedDoc> {
  const PDFDocument = (await import('pdfkit')).default;
  const fileName = `E2E_Learning_${Date.now()}.pdf`;
  const filePath = path.join(os.tmpdir(), fileName);
  generatedFiles.push(filePath);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(14).text('E2E Test Document', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(VERIFICATION_CONTENT);
    doc.moveDown();
    doc.fontSize(9).text(isolationContent('pdf'));
    doc.end();
    stream.on('finish', () => resolve(makeResult(filePath, fileName, 'pdf')));
    stream.on('error', reject);
  });
}

async function generateDocx(): Promise<GeneratedDoc> {
  const { Document, Packer, Paragraph, TextRun } = await import('docx');
  const fileName = `E2E_Learning_${Date.now()}.docx`;
  const filePath = path.join(os.tmpdir(), fileName);
  generatedFiles.push(filePath);

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: 'E2E Test Document', bold: true, size: 28 })] }),
        ...VERIFICATION_CONTENT.split('\n').map(line =>
          new Paragraph({ children: [new TextRun({ text: line, size: 22 })] })
        ),
        new Paragraph({ children: [new TextRun({ text: '' })] }),
        ...isolationContent('docx').split('\n').map(line =>
          new Paragraph({ children: [new TextRun({ text: line, size: 18, italics: true })] })
        ),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  return makeResult(filePath, fileName, 'docx');
}

async function generateXlsx(): Promise<GeneratedDoc> {
  const ExcelJS = await import('exceljs');
  const fileName = `E2E_Learning_${Date.now()}.xlsx`;
  const filePath = path.join(os.tmpdir(), fileName);
  generatedFiles.push(filePath);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Company Info');
  sheet.columns = [
    { header: 'Field', key: 'field', width: 20 },
    { header: 'Value', key: 'value', width: 40 },
  ];
  sheet.addRow({ field: 'Company Name', value: 'GBase E2E Test Company' });
  sheet.addRow({ field: 'Founded', value: '2020' });
  sheet.addRow({ field: 'CEO', value: 'Tanaka Taro' });
  sheet.addRow({ field: 'Revenue', value: '500 million yen' });
  sheet.addRow({ field: 'Headquarters', value: 'Shibuya, Tokyo' });
  sheet.addRow({ field: 'Test ID', value: `E2E_Learning_${Date.now()}_xlsx` });

  await workbook.xlsx.writeFile(filePath);
  return makeResult(filePath, fileName, 'xlsx');
}

// ── Public API ──

const GENERATORS: Record<string, () => GeneratedDoc | Promise<GeneratedDoc>> = {
  txt: generateTxt,
  md: generateMd,
  csv: generateCsv,
  html: generateHtml,
  pdf: generatePdf,
  docx: generateDocx,
  xlsx: generateXlsx,
};

export async function generateTestDoc(format: string): Promise<GeneratedDoc> {
  const gen = GENERATORS[format];
  if (!gen) throw new Error(`Unsupported format: ${format}`);
  return gen();
}

export function cleanupTestDocs(): void {
  for (const fp of generatedFiles) {
    try { fs.unlinkSync(fp); } catch { /* already deleted */ }
  }
  generatedFiles.length = 0;
}
```

- [ ] **Step 2: Verify the generator works**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
npx tsx -e "
import { generateTestDoc, cleanupTestDocs } from './tests/helpers/test-doc-generator';
import * as fs from 'fs';
for (const fmt of ['txt','md','csv','html','pdf','docx','xlsx']) {
  const doc = await generateTestDoc(fmt);
  console.log(fmt, fs.statSync(doc.filePath).size, 'bytes', doc.fileName);
}
cleanupTestDocs();
console.log('All formats generated and cleaned up OK');
"
```

Expected: 7 lines showing each format with a non-zero file size, then "All formats generated and cleaned up OK".

If `tsx` is not installed: `npm install --save-dev tsx` first, or verify by importing in a Playwright test later.

- [ ] **Step 3: Commit**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
git add tests/helpers/test-doc-generator.ts
git commit -m "feat: add test document generator for 7 file formats"
```

---

### Task 3: Build the learning status polling utility

**Files:**
- Create: `tests/helpers/learning-utils.ts`

- [ ] **Step 1: Create the utility**

Create `tests/helpers/learning-utils.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
git add tests/helpers/learning-utils.ts
git commit -m "feat: add learning status polling utility"
```

---

### Task 4: Discover selectors + Build the main test file

This task combines live page inspection with test file creation. The implementer MUST discover the real selectors BEFORE writing the test file. Do NOT proceed to Step 2 until Step 1 is complete.

**Files:**
- Create: `tests/dataset-file-learning.spec.new.ts`
- Reference: `tests/dataset-crud.spec.new.ts` (dataset creation/deletion pattern)
- Reference: `tests/helpers/auth.ts` (login, navigateToBot, clickBotSidebar)

- [ ] **Step 1: Discover selectors via live page inspection**

Use Playwright MCP browser tools to inspect the live staging site. You need to find these selectors:

**A. Dataset detail → File upload UI:**
1. Login to `https://admin-staging.gbase.ai`
2. Navigate to any existing dataset's detail page
3. Click the `ファイルとドキュメント` tab (if visible)
4. Take a snapshot. Find:
   - How to trigger file upload (button text? hidden `input[type="file"]`? drag zone?)
   - Record the exact selector for the upload trigger

**B. Bot data-source → Link dataset UI:**
1. Navigate to BDD_Test_Agent via bot search
2. Click sidebar link `データソース`
3. Take a snapshot of the `/bot/{id}/data-source` page. Find:
   - The button/link to add a dataset (exact text, role)
   - What happens when clicked (modal? dropdown? page navigation?)
   - How to select a dataset by name
   - How to unlink/remove a linked dataset
4. Record all selectors

**C. Bot chat → Q&A UI:**
1. Navigate to `/bot/{id}/chat`
2. Take a snapshot. Find:
   - Chat input field (role, placeholder, aria-label)
   - How to send a message (Enter key or Send button?)
   - Where bot responses appear (CSS class, role, container selector)
3. Record all selectors

**Output:** Write a temporary note with the 6+ discovered selectors. These go directly into the test file in Step 2.

- [ ] **Step 2: Create the test file using discovered selectors**

Create `tests/dataset-file-learning.spec.new.ts`. Replace ALL `DISCOVERED:` comments below with the actual selectors found in Step 1:

```typescript
import { test, expect } from '@playwright/test';
import { login, navigateToBot, clickBotSidebar } from './helpers/auth';
import { generateTestDoc, cleanupTestDocs, type GeneratedDoc } from './helpers/test-doc-generator';
import { waitForLearningComplete } from './helpers/learning-utils';

const FILE_FORMATS = ['txt', 'md', 'csv', 'html', 'pdf', 'docx', 'xlsx'];

test.describe('ファイル学習 @dataset @learning', () => {
  // State flags for conditional cleanup
  let datasetName: string;
  let datasetCreated = false;
  let datasetLinked = false;

  test.afterEach(async ({ page }) => {
    // Conditional cleanup — best-effort, errors are swallowed
    if (datasetLinked) {
      try {
        await navigateToBot(page, 'BDD_Test_Agent');
        await clickBotSidebar(page, 'データソース');
        await page.waitForLoadState('networkidle', { timeout: 10_000 });
        // DISCOVERED: Click the unlink/remove button for the dataset
        // e.g., find the dataset row by name, click its remove button
      } catch { /* best-effort cleanup */ }
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
      } catch { /* best-effort cleanup */ }
    }

    cleanupTestDocs();
    datasetCreated = false;
    datasetLinked = false;
  });

  for (const format of FILE_FORMATS) {
    test(`${format}ファイルの学習→Q&A検証 @L3 @P0`, async ({ page }) => {
      test.setTimeout(240_000); // 4 minutes

      // ── Step 1: Generate test document ──
      const doc = await generateTestDoc(format);

      // ── Step 2: Login and create dataset ──
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

      // ── Step 3: Upload file ──
      // Click the FileTab if visible (dataset may already show it)
      const fileTab = page.getByText('ファイルとドキュメント').first();
      if (await fileTab.isVisible().catch(() => false)) {
        await fileTab.click();
        await page.waitForTimeout(1000);
      }

      // DISCOVERED: Use the exact upload mechanism found in Step 1.
      // The implementer MUST replace this block with the real upload flow.
      // Common pattern for hidden file input:
      //   await page.locator('input[type="file"]').setInputFiles(doc.filePath);
      // Common pattern for upload button that opens file chooser:
      //   const [fileChooser] = await Promise.all([
      //     page.waitForEvent('filechooser'),
      //     page.getByRole('button', { name: 'DISCOVERED_UPLOAD_TEXT' }).click(),
      //   ]);
      //   await fileChooser.setFiles(doc.filePath);

      // Wait for upload to complete
      await page.waitForTimeout(3000);

      // ── Step 4: Poll learning status ──
      const learningResult = await waitForLearningComplete(page);
      if (learningResult === 'timeout') {
        test.info().annotations.push({
          type: 'soft-fail',
          description: '学習未完了のため失敗の可能性あり',
        });
      }

      // ── Step 5: Link dataset to bot ──
      await navigateToBot(page, 'BDD_Test_Agent');
      await clickBotSidebar(page, 'データソース');
      await page.waitForLoadState('networkidle', { timeout: 10_000 });

      // DISCOVERED: Use the exact link-dataset flow found in Step 1.
      // The implementer MUST replace this block with the real linking flow.
      // Example pattern (adjust based on actual UI):
      //   await page.getByRole('button', { name: 'DISCOVERED_ADD_TEXT' }).click();
      //   await page.getByRole('textbox').fill(datasetName);
      //   await page.getByText(datasetName).click();
      //   await page.getByRole('button', { name: 'DISCOVERED_CONFIRM_TEXT' }).click();

      // Only set datasetLinked AFTER the linking action above succeeds
      datasetLinked = true;

      // ── Step 6: Q&A verification ──
      await clickBotSidebar(page, 'チャット');
      await page.waitForLoadState('networkidle', { timeout: 10_000 });

      // DISCOVERED: Use the exact chat input selector found in Step 1.
      // Replace with real selector:
      const chatInput = page.getByRole('textbox'); // DISCOVERED: adjust role/name
      await chatInput.fill(doc.verificationQ);
      await chatInput.press('Enter');

      // DISCOVERED: Use the exact response container selector found in Step 1.
      // Replace with real selector:
      await expect(
        page.locator('[class*="message"]').last() // DISCOVERED: adjust selector
      ).toContainText(doc.expectedA, { timeout: 30_000 });
    });
  }
});
```

**CRITICAL:** Every line marked `DISCOVERED:` MUST be replaced with real selectors from Step 1 before this file can work. Do not commit until all `DISCOVERED:` comments are resolved.

- [ ] **Step 3: Run only the TXT test to verify the full flow**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
npx playwright test dataset-file-learning --config=playwright.new.config.ts --grep "txtファイル" --headed
```

Watch the headed browser to verify each step. Fix selectors as needed.

- [ ] **Step 4: Run all 7 format tests**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
npx playwright test dataset-file-learning --config=playwright.new.config.ts --headed
```

Expected: All 7 tests pass (or soft-fail on learning timeout — this is acceptable).

- [ ] **Step 5: Commit**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
git add tests/dataset-file-learning.spec.new.ts
git commit -m "feat: add file learning E2E tests for 7 formats"
```

---

### Task 5: Update CI timeout

**Files:**
- Modify: `.github/workflows/e2e-tests.yml:75` (change `timeout-minutes: 20` → `timeout-minutes: 45`)

- [ ] **Step 1: Update the timeout**

In `.github/workflows/e2e-tests.yml`, find the `e2e-new` job and change:

```yaml
# Before (line 75):
    timeout-minutes: 20

# After:
    timeout-minutes: 45
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
git add .github/workflows/e2e-tests.yml
git commit -m "ci: increase e2e-new timeout to 45 min for learning tests"
```

---

### Task 6: Update selector memory and product map

**Files:**
- Modify: `.test-memory/selectors.json`
- Modify: `.test-memory/product-map.json`

- [ ] **Step 1: Add discovered selectors to selectors.json**

Add entries using the ACTUAL selectors that were discovered and verified in Task 4. Example format for each:

```json
"dataset-detail.file-tab": {
  "selector": "getByText('ファイルとドキュメント').first()",
  "alternatives": [],
  "confidence": 0.8,
  "lastVerified": "2026-03-20",
  "failHistory": []
}
```

Add all 6 selectors:
- `dataset-detail.file-tab`
- `dataset-detail.upload-button`
- `dataset-detail.learning-status`
- `bot-chat.input`
- `bot-chat.message`
- `bot-data-source.add-dataset`

Use the exact selector strings that are working in the test file.

- [ ] **Step 2: Update product-map.json testCoverage**

Update `dataset-detail` page entry from `"partial"` to `"full"` (now has display + interaction + CRUD/learning tests).

- [ ] **Step 3: Commit**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
git add .test-memory/selectors.json .test-memory/product-map.json
git commit -m "chore: update selector memory and product map for learning tests"
```

---

### Task 7: Final verification and push

- [ ] **Step 1: Run all new tests to confirm nothing is broken**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
npx playwright test --config=playwright.new.config.ts
```

Expected: All tests pass (file learning tests may soft-fail on learning timeout — this is acceptable).

- [ ] **Step 2: Push to trigger CI**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
git push
```

- [ ] **Step 3: Verify CI run starts and both jobs execute**

```bash
gh run list --limit 1
```

Expected: A new run with both "Stable Tests" and "New Tests" jobs. The "New Tests" job should have timeout-minutes: 45.
