# File Upload & Learning E2E Tests — Design Spec

**Goal:** Automatically generate test documents in 7 file formats, upload them to GBase knowledge bases, verify learning completion, and validate knowledge retrieval via chatbot Q&A.

**Architecture:** A test document generator creates files at runtime with fixed verification content and random isolation content. Each file format gets an independent test case that creates a dataset, uploads the file, polls for learning completion, links the dataset to an existing bot, asks a verification question via chat, and cleans up all resources.

**Tech Stack:** Playwright, Node.js, pdfkit (PDF), docx (DOCX), exceljs (XLSX)

---

## 1. Test Document Generator

### File: `tests/helpers/test-doc-generator.ts`

Generates test documents in 7 formats. Each document contains two content zones:

**Verification Zone (fixed):**
```
GBase E2E Test Company was founded in 2020.
The CEO is Tanaka Taro.
Annual revenue is 500 million yen.
The headquarters is located in Shibuya, Tokyo.
```

This content is used for Q&A assertions after learning. The verification question is `"GBase E2E Test Companyの設立年は？"` and the expected answer must contain `"2020"`.

**Isolation Zone (random):**
```
Test ID: E2E_Learning_{timestamp}_{format}
Generated at: {ISO timestamp}
This document is for automated E2E testing purposes only.
```

Prevents cross-run data pollution. The timestamp ensures each test run produces unique documents.

### Supported Formats

| Format | Extension | Generator | npm Package |
|--------|-----------|-----------|-------------|
| Plain Text | `.txt` | `fs.writeFileSync` | none |
| Markdown | `.md` | `fs.writeFileSync` | none |
| CSV | `.csv` | `fs.writeFileSync` | none |
| HTML | `.html` | `fs.writeFileSync` | none |
| PDF | `.pdf` | pdfkit stream | `pdfkit` |
| Word | `.docx` | docx Paragraph API | `docx` |
| Excel | `.xlsx` | exceljs workbook API | `exceljs` |

### Interface

```typescript
interface GeneratedDoc {
  filePath: string;       // Absolute path to temporary file
  fileName: string;       // e.g. "E2E_Learning_1710945600000.pdf"
  format: string;         // "txt" | "md" | "csv" | "html" | "pdf" | "docx" | "xlsx"
  verificationQ: string;  // "GBase E2E Test Companyの設立年は？"
  expectedA: string;      // "2020"
}

function generateTestDoc(format: string): Promise<GeneratedDoc>
function cleanupTestDocs(): void
```

Temporary files are written to `os.tmpdir()` and cleaned up by `cleanupTestDocs()` in test teardown.

---

## 2. Learning Status Utilities

### File: `tests/helpers/learning-utils.ts`

#### `waitForLearningComplete(page, options?)`

Polls the dataset detail page for the `学習済み` status indicator. Each poll iteration calls `page.reload()` then checks for the status text, since the platform may not push status updates via WebSocket.

- **Polling method:** `page.reload()` → check `page.getByText('学習済み').isVisible()`
- **Interval:** 10 seconds between checks
- **Timeout:** 2 minutes maximum
- **Returns:** `'completed'` or `'timeout'`

```typescript
async function waitForLearningComplete(
  page: Page,
  options?: { timeout?: number; interval?: number }
): Promise<'completed' | 'timeout'>
```

#### Degradation Behavior

| Poll Result | Q&A Behavior | Test Outcome |
|-------------|-------------|--------------|
| `completed` | Normal assertion | Pass/Fail based on answer |
| `timeout` | Still attempts Q&A | Annotated as `soft-fail`; failure message notes `学習未完了のため失敗の可能性あり` |

---

## 3. Test Structure

### File: `tests/dataset-file-learning.spec.new.ts`

```typescript
const FILE_FORMATS = ['txt', 'md', 'csv', 'html', 'pdf', 'docx', 'xlsx'];

test.describe('ファイル学習 @dataset @learning', () => {
  for (const format of FILE_FORMATS) {
    test(`${format}ファイルの学習→Q&A検証 @L3 @P0`, async ({ page }) => {
      // ... test body
    });
  }
});
```

### Test Flow Per Format

```
Step 1: generateTestDoc(format)
   → Creates temporary file with verification + isolation content

Step 2: Create dataset (inline, same pattern as dataset-crud.spec.new.ts)
   → Navigate to /datasets via sidebar link 'ナレッジベース'
   → Click 'ナレッジベースの作成' button
   → In dialog: fill first textbox with "E2E_Learning_{timestamp}_{format}"
   → Fill second textbox with "Automated file learning test - safe to delete"
   → Click '送信する' button
   → Wait for redirect to /datasets/{new-id}

Step 3: Upload file
   → Navigate to dataset detail → FileTab（ファイルとドキュメント）
   → Use Playwright fileChooser API to upload the generated file

Step 4: Poll learning status
   → waitForLearningComplete(page) → 'completed' | 'timeout'
   → On timeout: annotate test, continue to Q&A attempt

Step 5: Link dataset to bot
   → Use navigateToBot(page, 'BDD_Test_Agent') helper
   → Click sidebar link 'データソース' via clickBotSidebar(page, 'データソース')
   → On /bot/{id}/data-source page, click the add/link button (discover exact selector at implementation time via live page inspection)
   → Search for and select the dataset by name "E2E_Learning_{timestamp}_{format}"
   → NOTE: The exact UI flow for linking (modal? dropdown? search panel?) must be discovered by inspecting the live staging page during implementation. The implementer should use Playwright MCP browser tools to snapshot the data-source page and identify the correct interaction sequence.

Step 6: Q&A verification
   → Navigate to /bot/{BDD_Test_Agent_ID}/chat
   → Send: "GBase E2E Test Companyの設立年は？"
   → Assert: response contains "2020" (timeout: 30s)

Step 7: Cleanup (in test.afterEach, conditional)
   → If dataset was linked to bot: unlink it (navigate to bot data-source, remove)
   → If dataset was created: delete it (navigate to /datasets, search, menu → 削除 → confirm)
   → Always: cleanupTestDocs() to remove temporary files
   → Use state flags (e.g. datasetCreated, datasetLinked) to track which cleanup steps are needed
```

### Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Test timeout | 240,000ms (4 min) | Includes login (~15s) + create (~15s) + upload (~10s) + learning poll (up to 120s) + bot link (~15s) + Q&A (~30s) + cleanup (~15s) |
| Learning poll interval | 10,000ms | Balance between responsiveness and load |
| Learning poll timeout | 120,000ms (2 min) | Covers typical learning duration |
| Q&A response timeout | 30,000ms | Bot response generation time |
| Worker count | 1 (serial) | Shared bot resource, no concurrent conflict |

### Tags

- `@dataset` — Dataset module
- `@learning` — File learning feature
- `@L3` — CRUD/integration level
- `@P0` — Core functionality

---

## 4. Bot Association

Uses the existing `BDD_Test_Agent` bot on staging. The bot ID is resolved at test time by navigating to the bot list and searching.

**Why not create a temporary bot:** Each test already takes ~3 minutes for learning. Creating + deleting a bot adds complexity and time. Single-worker execution prevents concurrent conflicts with the shared bot.

**Association flow:**
1. Navigate to `/bot/{id}/data-source`
2. Click add/link dataset button
3. Select the test dataset by name
4. After Q&A verification, unlink the dataset before deletion

---

## 5. File Dependencies

### New npm packages

```json
{
  "devDependencies": {
    "pdfkit": "^0.15.0",
    "@types/pdfkit": "^0.13.0",
    "docx": "^9.0.0",
    "exceljs": "^4.4.0"
  }
}
```

### New files

```
tests/
├── helpers/
│   ├── test-doc-generator.ts    # Document generation (7 formats)
│   └── learning-utils.ts        # waitForLearningComplete + degradation
├── dataset-file-learning.spec.new.ts  # 7 test cases
```

### Modified files

```
package.json                                    # Add pdfkit, @types/pdfkit, docx, exceljs
.github/workflows/e2e-tests.yml                 # Increase e2e-new timeout to 45 minutes
```

---

## 6. CI Integration

The file learning tests run as part of the existing `e2e-new` job in `.github/workflows/e2e-tests.yml` (located at repo path `apps/ai-test-engine/.github/workflows/e2e-tests.yml`).

**Required workflow change:** The `e2e-new` job `timeout-minutes` must be increased from `20` to `45` to accommodate 7 learning tests at ~4 minutes each (worst case ~28 minutes + overhead).

**Impact on CI timing:** 7 tests x ~4 minutes = ~28 minutes worst case (serial), plus existing new tests (~5 minutes). Total ~33 minutes.

---

## 7. Selector Memory

After implementation, the following selectors should be added to `.test-memory/selectors.json`:

- `dataset-detail.file-tab` — FileTab selector
- `dataset-detail.upload-button` — File upload trigger
- `dataset-detail.learning-status` — Learning status indicator
- `bot-chat.input` — Chat input field
- `bot-chat.message` — Chat response message
- `bot-data-source.add-dataset` — Add dataset to bot button

---

## 8. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Learning takes >2 min for large files | Test timeout | Files are small (~500 bytes text); timeout degradation continues to Q&A |
| Staging bot deleted/renamed | All Q&A tests fail | Bot ID resolved by search, not hardcoded; fallback to skip Q&A |
| File format not supported by platform | Upload fails | Test reports which format failed; useful for discovering actual support |
| Chat response doesn't contain exact keyword | False negative | Use loose matching (`toContainText`) not exact match |
| Concurrent CI runs | Shared bot conflict | Single worker; dataset names have unique timestamps |
