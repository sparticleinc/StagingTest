# Phase 2: Self-Healing Selectors + Deep Test Coverage

## Overview

Phase 2 extends the AI Test Engine with two capabilities:

1. **Self-Healing Selectors** — automatic detection and repair of broken selectors when tests fail, integrated into the test run cycle
2. **Deep Test Coverage** — priority-based generation of interaction and CRUD tests, expanding beyond the display-only tests generated in Phase 1

### Terminology: Test Depth vs Difficulty Tags

**Important**: This spec introduces **test depth** (display / interaction / crud) as a separate concept from **difficulty tags** (`@L1`-`@L5`) used in Phase 1.

- **Difficulty tags** (`@L1`-`@L5`): Inherited from Phase 1, used as Playwright `@tag` annotations in test files. L1=reachability, L2=CRUD operations, L3=form validation, L4=workflow, L5=edge cases. These remain unchanged.
- **Test depth** (`display` / `interaction` / `crud`): New concept in Phase 2, describes the *coverage depth* for the `--depth` parameter of `/test-gen`. Maps to appropriate difficulty tags when generating tests.

Mapping from depth to difficulty tags:

| Depth | Generated Test Tags |
|-------|-------------------|
| `display` | `@L1` |
| `interaction` | `@L1` or `@L2` depending on complexity |
| `crud` | `@L2` (CRUD) + `@L3` (validation) |

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Heal trigger | Auto-heal first, manual command also available | Git provides safe rollback; serial tasks stop on failure anyway |
| Coverage scope | Priority-based batches (P0→P1→P2) | 25 uncovered pages — full CRUD for all is excessive; prioritize by business value |
| Escalation strategy | Tiered (simple=auto, complex=needs-human) | Avoid noise from easy fixes, avoid missing real structural changes |
| Architecture | Centralized in run-tests (方案 A) | One command for the full loop; heal logic extracted to its own skill for independent use |

---

## 1. Self-Healing System

### 1.1 Core Flow

The `run-tests` skill is extended into a **run → diagnose → heal → re-run** closed loop:

```
1. Run Playwright (npx playwright test)
2. All passed → bump selectors.json confidence (+0.02, cap 0.99) → done
3. Failures exist → parse Playwright report, extract failure info
4. Classify each failure:
   ├── SELECTOR_BROKEN  — "waiting for locator" / "strict mode violation" / element not found
   ├── ASSERTION_FAILED — expect().toBe / toHaveText assertion mismatch
   ├── NAVIGATION_ERROR — timeout, network error, page not loaded
   └── UNKNOWN          — anything else
5. SELECTOR_BROKEN → invoke heal-selectors skill:
   a. Read the broken selector from the test file
   b. Look up alternatives in selectors.json
   c. If alternative exists → substitute and re-run
   d. If not → visit the target page, use page context to relocate the element
   e. Found new selector → update test file + selectors.json + heal-history.json
   f. Not found → mark needs-human
6. Re-run healed tests once (max 1 retry round, no infinite loops)
7. Generate repair report
```

### 1.2 Failure Classification

Extract keywords from Playwright error messages:

| Pattern | Classification |
|---------|---------------|
| `"waiting for locator"` / `"locator resolved to"` / `"strict mode violation"` | `SELECTOR_BROKEN` |
| `"expect(received)"` / `"Expected:"` / `"Received:"` | `ASSERTION_FAILED` |
| `"ERR_CONNECTION"` / `"Timeout exceeded"` / `"net::ERR"` | `NAVIGATION_ERROR` |
| Everything else | `UNKNOWN` |

### 1.3 Selector Repair Levels

Repairs are attempted in order from simplest to most complex. The first success wins:

| Level | Scenario | Action |
|-------|----------|--------|
| **R1 Text Fix** | Selector text changed (i18n key updated) | Read i18n JSON (path from `.test-config.json` → `i18nPath`), find new text by searching for the old text's i18n key, direct replacement. Fallback: if i18n file unavailable, skip to R2. |
| **R2 Alternative Swap** | Primary selector broken, alternative in selectors.json works | Swap to alternative; demote original to alternatives list |
| **R3 Relocate** | All known selectors broken | Agent navigates to the target page using Playwright (same auth flow as tests — login via `auth.setup.ts`). Extracts the page URL from the test file's `page.goto()` call. For parameterized URLs (e.g., `/bot/:id/settings`), uses a known entity from `selectors.json` or skips to R4. On the live page, agent reads visible elements and uses ARIA role / placeholder / text-content to propose a new selector. Agent verifies the new selector finds exactly 1 element before accepting. |
| **R4 needs-human** | Page restructured, element no longer exists | Mark `needs-human`, write to report, do NOT modify test file |

### 1.4 Memory Updates on Heal

When a repair succeeds:
- `selectors.json`: Update `selector` field, old selector added to `failHistory`, confidence set to 0.7 (unverified until next passing run)
- `heal-history.json`: Append repair record (date, file, old/new selector, level, status)
- `patterns.md`: If a new generalizable pattern is discovered, append it
- `changelog.md`: One-line repair event

When a repair fails (needs-human):
- `selectors.json`: Add failure to `failHistory`, confidence set to 0.3
- `heal-history.json`: Append with `status: "needs-human"`

### 1.5 Confidence Scoring Update Rules

| Event | Confidence Change |
|-------|-------------------|
| Test passes | +0.02 (cap 0.99) |
| Selector healed (R1 text fix) | Reset to 0.8 |
| Selector healed (R2 alternative) | Reset to 0.7 |
| Selector healed (R3 relocate) | Reset to 0.7 |
| Heal failed (needs-human) | Set to 0.3 |

Note: Confidence recovers naturally via the "+0.02 per pass" rule. A healed selector at 0.7 reaches 0.9 after 10 consecutive passes. No separate counter is needed — the `lastVerified` date and `confidence` value already track this implicitly.

---

## 2. Deep Test Coverage

### 2.1 Priority Assignment

A `priority` field is added to each page object in `product-map.json`. The Product Expert agent assigns priority when scanning; it can also be set manually. Assignment rules:

| Priority | Criteria | Target Coverage | Concrete Pages |
|----------|----------|----------------|----------------|
| **P0** | Main navigation pages + pages with defined `flows` | display + interaction + key crud | bot-list, bot-chat, bot-settings, dataset-list, dataset-detail, knowledge-base |
| **P1** | Pages with forms, tables, or CRUD capability | display + interaction | team, api-keys, bot-tag, collaborative, dictionary, bot-create, message-center |
| **P2** | Display-only, low-frequency, or stub pages | display only | bot-insights, bot-usage, bot-questions, org-settings, and remaining pages |

When `--depth` is used without `--page`, the default scope is:
- `--depth interaction` → P0 + P1 pages
- `--depth crud` → P0 pages only

When `--page` is specified, depth applies to that page regardless of priority.

### 2.2 Test Depth Definitions

| Depth | Content | Example | Difficulty Tags |
|-------|---------|---------|-----------------|
| **display** | Page reachable + key elements visible | Page loads, title shown, empty state | `@L1` |
| **interaction** | UI interaction verification | Tab switch, search/filter, sort, pagination, expand/collapse | `@L1` or `@L2` |
| **crud** | Complete CRUD flow | Create → verify → edit → delete, including cleanup | `@L2`, `@L3` |

### 2.3 Generation Strategy

The `generate-tests` skill is extended with a `depth` parameter:

```
/test-gen                              → Default: generate display tests for uncovered pages
/test-gen --depth interaction          → Generate interaction tests for P0/P1 pages
/test-gen --depth crud                 → Generate CRUD tests for P0 pages
/test-gen --page bot-settings          → Generate for a specific page (all depths)
/test-gen --depth crud --page bot-tag  → Generate CRUD tests for a specific page
```

### 2.4 Interaction Test Generation Logic

The agent inspects `product-map.json` → `components` to determine which interactions to test:

| Component Found | Test Generated |
|----------------|----------------|
| `Tabs` | Tab switching test (click each tab, verify content changes) |
| `TextInput` / `SearchInput` | Search/filter test (type query, verify list filters) |
| `Table` | Column visibility test + sort test (if sortable) |
| `Select` / `Menu` | Dropdown selection test |
| `Pagination` | Page navigation test |
| `Modal` | Open/close modal test |
| `Switch` / `Checkbox` | Toggle state test |

### 2.5 CRUD Test Generation Logic

Agent uses existing CRUD tests as templates:

1. Read same-type existing tests (e.g., `bot-crud.spec.ts` for bot-like pages)
2. Substitute page-specific selectors and routes
3. Ensure cleanup in `test.afterEach` (delete test data)
4. Use `timestamp-test-data` pattern (`E2E_{Module}_${Date.now()}`)
5. Follow `search-before-click` pattern for list operations

### 2.6 Batch Execution Plan

```
Batch 1: P0 pages → add interaction tests (~6 pages × 2-3 tests = ~15 tests)
Batch 2: P1 pages → add display + interaction tests (~7 pages × 2 tests = ~14 tests)
Batch 3: P0 pages → add CRUD tests (~3-4 flows = ~12 tests)
```

Estimates are approximate — actual counts depend on components found per page.

Each batch: generate → run → auto-heal if needed → all pass → commit → next batch.

---

## 3. Plugin Components

### 3.1 New Skill

| Skill | Responsibility |
|-------|---------------|
| `heal-selectors` | Core repair logic: classify failure → find alternative → relocate element → update files |

### 3.2 Extended Skills

| Skill | Extension |
|-------|-----------|
| `run-tests` | Add diagnose → heal → re-run loop; call `heal-selectors` on SELECTOR_BROKEN |
| `generate-tests` | Add `--depth interaction/crud` support; component-based interaction test generation |

### 3.3 New Command

| Command | Purpose |
|---------|---------|
| `/test-heal` | Manual trigger: read latest failure report → invoke `heal-selectors` |

### 3.4 New Reference

| File | Content |
|------|---------|
| `references/test-levels.md` | Test depth definitions (display/interaction/crud) + generation rules + component-to-test mapping |

### 3.5 New Memory File

| File | Purpose |
|------|---------|
| `.test-memory/heal-history.json` | Repair event log with date, file, old/new selector, repair level, status |

### 3.6 heal-history.json Schema

```json
{
  "version": "1.0",
  "repairs": [
    {
      "date": "2026-03-21",
      "testFile": "tests/bot-tag.spec.new.ts",
      "elementId": "bot-tag.page-title",
      "failType": "SELECTOR_BROKEN",
      "repairLevel": "R1",
      "oldSelector": "getByText('タグ管理')",
      "newSelector": "getByRole('main').getByText('タグ一覧')",
      "status": "fixed"
    }
  ]
}
```

`elementId` references the key in `selectors.json` (if the element is tracked there). For untracked selectors, use the format `{page-id}.{description}`.

---

## 4. Data Flow

```
/test-run
  → run-tests skill
    → npx playwright test
    → All pass? → update confidence → report
    → Failures? → parse failures → classify
      → SELECTOR_BROKEN → heal-selectors skill
        → Try R1 → R2 → R3 → R4 repair
        → Success → update test file + selectors.json + heal-history.json → re-run
        → Failure → mark needs-human → report
      → NAVIGATION_ERROR → retry the test once (staging server may be temporarily down)
        → Still fails → record in report as environment issue
      → ASSERTION_FAILED → record in report (may indicate real UI change, not auto-fixable)
      → UNKNOWN → record in report

/test-heal (manual)
  → Read latest Playwright JSON report (`test-results/.last-run.json` or `playwright-report/` output)
  → Invoke heal-selectors skill
  → Same flow as above

/test-gen --depth interaction
  → generate-tests skill
    → Read product-map.json for P0/P1 pages (filter by priority field)
    → Inspect components per page
    → Generate interaction tests (tagged @L1/@L2)
    → Output .spec.new.ts files
    → Update testCoverage in product-map.json

/test-gen --depth crud
  → generate-tests skill
    → Read product-map.json for P0 pages with flows
    → Find existing CRUD test templates
    → Generate CRUD tests with cleanup (tagged @L2/@L3)
    → Output .spec.new.ts files
    → Update testCoverage in product-map.json
```

---

## 5. Constraints

- **Max 1 re-run round** after healing — prevents infinite fix-run loops
- **Never delete existing .spec.ts files** — only create .spec.new.ts or modify selectors within existing files
- **needs-human items** are surfaced in the report but do NOT block other tests from running
- **heal-selectors** must not modify test logic (assertions, flow) — only selector strings
- **CRUD tests** must always include cleanup logic to avoid test data pollution
- **testCoverage field** in `product-map.json` is updated after test generation: `"none"` → `"partial"` (display only) → `"full"` (display + interaction + crud all present)
- **.spec.new.ts graduation**: After generated tests pass and are committed, the user may rename `.spec.new.ts` → `.spec.ts` at their discretion. The system treats both extensions identically during test runs (Playwright config includes both). Graduation is not automated — it's a user decision to "accept" generated tests as permanent
- **Repair report location**: `run-tests` writes a summary report to `test-results/heal-report.md` after each run with healing activity
