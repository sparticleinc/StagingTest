# Phase 1: Product Expert + Test Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Product Expert agent (scans frontend codebase → enriches product-map.json) and the Test Generator agent (generates Playwright tests for uncovered pages), verified by generating runnable tests for ≥3 uncovered pages with >80% pass rate.

**Architecture:** Two Claude Code Plugin agents backed by skills. Product Expert uses the `analyze-codebase` skill to parse routes, i18n, and components → writes enriched `product-map.json`. Test Generator uses the `generate-tests` skill to produce `.spec.new.ts` files using product-map + patterns + selectors memory. Both agents are markdown files that instruct Claude on how to perform their tasks.

**Tech Stack:** Claude Code Plugin system (Markdown agents/skills/commands), Playwright, React Router 6, Mantine v8, i18next

**Spec:** `docs/specs/2025-03-20-ai-test-engine-plugin-design.md` (§3 Agent 1 & Agent 2)

**Prerequisites:**
- Phase 0 complete (plugin skeleton at `/tmp/ai-test-engine-plugin/`, memory at `.test-memory/`)
- Frontend codebase at `/Users/lirh2025/Desktop/featureM/mygpt-frontend-prod_1014/apps/admin/`

---

## Key Discovery: Frontend Codebase Facts

Before implementing, the subagent must know these facts about the frontend:

| Fact | Value |
|------|-------|
| Frontend root | `/Users/lirh2025/Desktop/featureM/mygpt-frontend-prod_1014/apps/admin/` |
| Routes file | `src/routes/index.tsx` |
| i18n file | `/Users/lirh2025/Desktop/featureM/mygpt-frontend-prod_1014/packages/app/locales/ja/translations.json` (3873 lines) |
| UI framework | **Mantine v8.3.9** (NOT v7 as initially assumed) |
| Router | React Router DOM 6.8.1 |
| State | Zustand 4.3.3 |
| i18n | i18next 23.7.12 |
| Pages directory | `src/pages/` (28 page directories) |
| Components directory | `src/components/` (44 component directories) |
| Route modules | 4: AppRoutes, MainRoutes, BotRoutes, DatasetsRoutes |
| Total routes | ~85 (many are nested under `/bot/:id/`) |

**Pages currently tested (12):** auth, bot-list, bot-chat, bot-settings, bot-records, bot-dictionary, bot-dashboard, dataset-list, dataset-detail, api-keys, access-control, not-found

**Pages NOT tested (priority candidates):** team, account, collaborative, create (bot creation wizard), bot-tools, bot-capabilities, bot-data-source, bot-insights, bot-usage, bot-visitors, bot-realtime, bot-widget-embed, bot-questions, bot-tag, message-center, org-collaboration

---

## File Structure

### Plugin Repo (`/tmp/ai-test-engine-plugin/`)

```
ai-test-engine-plugin/
├── .claude-plugin/
│   └── plugin.json                         # MODIFY — add agents + new skills
├── agents/
│   ├── product-expert.md                   # CREATE — Product Expert agent
│   └── test-generator.md                   # CREATE — Test Generator agent
├── skills/
│   ├── run-tests/
│   │   └── SKILL.md                        # EXISTS (Phase 0)
│   ├── analyze-codebase/
│   │   └── SKILL.md                        # CREATE — Scan frontend codebase
│   └── generate-tests/
│       └── SKILL.md                        # CREATE — Generate .spec.new.ts files
├── commands/
│   ├── test-init.md                        # EXISTS
│   ├── test-run.md                         # EXISTS
│   ├── test-status.md                      # EXISTS
│   └── test-gen.md                         # CREATE — /test-gen command
├── references/
│   ├── playwright-patterns.md              # EXISTS
│   └── ui-framework-guides/
│       └── mantine-v8.md                   # CREATE — Mantine v8 selector guide
└── memory/
    └── (templates, unchanged)
```

### Project Repo (`/Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine/`)

```
ai-test-engine/
├── .test-config.json                       # MODIFY — set frontendPath
├── .test-memory/
│   ├── product-map.json                    # MODIFY — enriched by Product Expert
│   ├── selectors.json                      # MODIFY — new selectors added
│   ├── changelog.md                        # MODIFY — log changes
│   └── (others unchanged)
└── tests/
    └── *.spec.new.ts                       # CREATE — generated test files (user confirms merge)
```

---

## Task 1: Update `.test-config.json` with Frontend Path

**Files:**
- Modify: `StagingTest/.test-config.json`

- [ ] **Step 1: Update frontendPath**

```json
{
  "frontendPath": "/Users/lirh2025/Desktop/featureM/mygpt-frontend-prod_1014/apps/admin",
  "frontendBranch": "prod_1014",
  "backendPath": "",
  "backendBranch": "staging",
  "testCommand": "npx playwright test",
  "baseUrl": "https://admin-staging.gbase.ai",
  "i18nPath": "/Users/lirh2025/Desktop/featureM/mygpt-frontend-prod_1014/packages/app/locales/ja/translations.json",
  "routerConfigPath": "src/routes/index.tsx"
}
```

Notes:
- `i18nPath` is now an **absolute path** because the i18n file lives in the monorepo's shared `packages/` directory, not inside the admin app. Using an absolute path avoids ambiguity about which directory it's relative to.
- `routerConfigPath` is relative to `frontendPath` (the admin app root). NOTE: spec §2.2 shows `src/routes.tsx` but actual file is `src/routes/index.tsx`.
- `frontendPath` points to the admin app directory specifically, not the monorepo root.

- [ ] **Step 2: Commit**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
git add .test-config.json
git commit -m "fix: set frontendPath to actual frontend codebase location"
```

---

## Task 2: Create Mantine v8 Selector Guide

**Files:**
- Create: `ai-test-engine-plugin/references/ui-framework-guides/mantine-v8.md`

- [ ] **Step 1: Create `references/ui-framework-guides/mantine-v8.md`**

```markdown
# Mantine v8 — Playwright Selector Guide

## Overview

Mantine v8 (8.x) is a React component library. This guide documents reliable Playwright selector strategies for common Mantine components. These strategies were verified against the GBase Admin staging environment.

**Key difference from v7**: Mantine v8 uses CSS modules by default, making class-based selectors unreliable. Always prefer ARIA-based selectors.

## Component Selector Strategies

### Tabs (`@mantine/core` Tabs)
```typescript
// ✅ CORRECT — use full tab label text
page.getByRole('tab', { name: '一般設定' })

// ❌ WRONG — partial text doesn't match
page.getByText('一般', { exact: true })
```
- Mantine Tab renders the full label text (e.g., "一般設定" not "一般")
- Tab panels: `getByRole('tabpanel')`

### TextInput
```typescript
// ✅ Best — by placeholder (unique per field)
page.getByPlaceholder('チャットボットの名前を入力してください')

// ✅ Good — by label
page.getByLabel('名前')

// ❌ WRONG — positional (may hit readonly fields)
page.getByRole('textbox').first()
```

### Button
```typescript
// ✅ Standard button
page.getByRole('button', { name: 'OK' })

// ✅ Duplicate buttons — use .last() for dialog confirm
page.getByRole('button', { name: '削除' }).last()
```

### Modal / Dialog
```typescript
// ✅ By dialog title
page.getByRole('dialog', { name: 'AIアシスタントを作成しています' })
```

### Menu (ActionIcon with dropdown)
```typescript
// ✅ Menu items have role="menuitem"
page.getByRole('menuitem', { name: '削除' })

// ⚠️ Menu trigger buttons often have NO accessible name
// Use evaluate() for DOM traversal from nearby text
```

### Select / Dropdown
```typescript
// Open the select
page.getByRole('combobox', { name: 'ラベル' }).click()
// Then select option
page.getByRole('option', { name: 'オプション値' }).click()
```

### Card (with action buttons)
```typescript
// ⚠️ Card action buttons (three-dot menu) often lack accessible names
// Reliable approach: find card by text, then traverse DOM
const card = page.getByText('BDD_Test_Agent', { exact: true });
await card.evaluate(el => {
  let c = el.parentElement;
  while (c) {
    const btn = c.querySelector('button');
    if (btn) { btn.click(); return; }
    c = c.parentElement;
  }
});
```

### Navbar / Navigation
```typescript
// ✅ Links with text
page.getByRole('link', { name: 'マイボット' })
page.getByRole('link', { name: 'ナレッジベース' })
```

### Table
```typescript
// ✅ Table headers
page.getByRole('columnheader', { name: 'ヘッダー名' })
// ✅ Table rows — locate by cell content
page.getByRole('row').filter({ hasText: '行のテキスト' })
```

### Switch / Checkbox
```typescript
// ✅ By label
page.getByRole('switch', { name: 'ラベル' })
page.getByRole('checkbox', { name: 'ラベル' })
```

## General Rules

1. **Always prefer ARIA selectors** — Mantine v8 CSS classes are generated and unstable
2. **Japanese text must be exact** — no spaces before particles (を、が、は)
3. **Use `{ exact: true }` with getByText** — avoid substring matching
4. **Wait for networkidle after navigation** — Mantine pages load lazily
5. **Cards without accessible button names** — use `evaluate()` for DOM traversal
```

- [ ] **Step 2: Commit**

```bash
cd /tmp/ai-test-engine-plugin
git add references/ui-framework-guides/
git commit -m "feat: add Mantine v8 selector guide"
```

---

## Task 3: Create `analyze-codebase` Skill

**Files:**
- Create: `ai-test-engine-plugin/skills/analyze-codebase/SKILL.md`

- [ ] **Step 1: Create `skills/analyze-codebase/SKILL.md`**

```markdown
---
name: analyze-codebase
description: Scan frontend codebase to extract routes, components, i18n keys → enrich product-map.json
---

# analyze-codebase Skill

Scan the frontend React codebase and produce a structured product map.

## Prerequisites

- `.test-config.json` must exist with a non-empty `frontendPath`
- The frontend codebase must be accessible at that path

## Execution Steps

### 1. Read Configuration

Load `.test-config.json` to get:
- `frontendPath` — root of the frontend app (e.g., `/path/to/apps/admin`)
- `i18nPath` — absolute path to Japanese translation JSON file
- `routerConfigPath` — relative path to routes file (relative to `frontendPath`)

### 2. Parse Routes

Read the router config file (e.g., `src/routes/index.tsx`):

- Extract all `<Route path="..." element={<Component />} />` definitions
- Track which route modules exist (e.g., BotRoutes, MainRoutes, DatasetsRoutes)
- For nested routes (e.g., `/bot/:id/*`), combine parent + child paths
- Record the component name for each route (e.g., `LazyChatPage` → `Bot/Chat`)
- Resolve lazy imports to find the actual page component file path

**Output per route:**
```json
{
  "id": "bot-chat",
  "path": "/bot/:id/chat",
  "componentPath": "src/pages/Bot/Chat/index.tsx",
  "componentName": "ChatPage"
}
```

### 3. Scan Page Components

For each page component file:

1. Read the file and its imports
2. Identify key interactive elements:
   - Forms (look for `useForm`, `<form>`, `<TextInput>`, `<Select>`, `<Textarea>`)
   - Buttons (look for `<Button>`, `<ActionIcon>`, `onClick` handlers)
   - Dialogs/Modals (look for `useDisclosure`, `<Modal>`, `modals.open`)
   - Tables (look for `<Table>`, `<DataTable>`, column definitions)
   - Tabs (look for `<Tabs>`, `<Tabs.Tab>`)
3. Extract component names referenced in the page
4. Identify CRUD operations (create/update/delete patterns)
5. Look for `useTranslation()` / `t('key')` calls → collect i18n keys

**Output per page:**
```json
{
  "components": ["ChatInput", "MessageList", "TypingIndicator"],
  "interactiveElements": ["form:messageInput", "button:send", "button:share"],
  "i18nKeys": ["chat.placeholder", "chat.send", "chat.share"],
  "hasCRUD": false,
  "hasForm": true,
  "hasTabs": false,
  "hasTable": false,
  "hasModal": false
}
```

### 4. Parse i18n File

Read the Japanese translation JSON file:

1. Build a flat key→value map (e.g., `"bot.settings.general"` → `"一般設定"`)
2. For each page's collected i18n keys, resolve to Japanese text
3. Store resolved text in `keySelectors` for selector generation

### 5. Determine Test Coverage

Compare discovered pages against existing test files in `tests/`:

- For each route, check if a `*.spec.ts` file tests that page
- Assign coverage: `"full"` (dedicated test file), `"partial"` (tested as part of flow), `"none"` (no tests)

### 6. Update product-map.json

Merge discoveries into existing `.test-memory/product-map.json`:

- Add new pages (don't remove existing ones — they may have manual enrichments)
- Update existing pages with new component/i18n data
- Set `testCoverage` based on analysis
- Preserve existing `keySelectors` entries
- Update `lastUpdated` timestamp
- Add any new multi-step flows discovered (e.g., account settings flow)

### 7. Update changelog.md

Append entry: `- YYYY-MM-DD: analyze: Scanned frontend codebase, discovered N new pages, M i18n keys`

### 8. Report

Output a summary:
```
🔍 Codebase Analysis Complete
==============================
📄 Routes discovered: 45
📦 Pages scanned: 28
🆕 New pages added to map: 16
🌐 i18n keys collected: 234
📊 Coverage: 12 tested / 28 total (43%)

Uncovered pages (candidates for /test-gen):
  - /team (Team management)
  - /account (Account settings)
  - /bot/:id/tools (Bot tools config)
  - ...
```
```

- [ ] **Step 2: Commit**

```bash
cd /tmp/ai-test-engine-plugin
git add skills/analyze-codebase/
git commit -m "feat: add analyze-codebase skill"
```

---

## Task 4: Create Product Expert Agent

**Files:**
- Create: `ai-test-engine-plugin/agents/product-expert.md`

- [ ] **Step 1: Create `agents/product-expert.md`**

```markdown
---
name: product-expert
description: Scans frontend codebase to build and maintain product-map.json — the structured knowledge of every page, component, and i18n key in the application.
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
model: sonnet
color: blue
---

# Product Expert Agent

You are the Product Expert for this project's E2E test system. Your job is to understand the frontend codebase and maintain a structured product map that other agents (Test Generator, Test Healer) depend on.

## When You Are Invoked

1. **First time** (`/test-init` or when product-map.json has no pages): Full scan
2. **Code changes detected** (flag file `.test-memory/.pending-scan` exists): Incremental update
3. **User invokes** `/test-gen`: Refresh map before test generation

## Your Workflow

### Step 1: Load Context

1. Read `.test-config.json` to get `frontendPath`, `i18nPath`, `routerConfigPath`
2. Read `.test-memory/product-map.json` for existing state
3. Read `.test-memory/selectors.json` for known selectors
4. Read `references/ui-framework-guides/mantine-v8.md` for selector strategies

### Step 2: Invoke analyze-codebase Skill

Follow the `analyze-codebase` skill instructions to:
- Parse routes → discover all pages
- Scan page components → identify interactive elements
- Parse i18n → resolve Japanese labels
- Determine test coverage

### Step 3: Enrich product-map.json

For each discovered page, create a rich entry:

```json
{
  "id": "team",
  "path": "/team",
  "title": "チーム管理",
  "components": ["MemberList", "InviteDialog", "RoleSelect"],
  "keySelectors": {
    "invite-button": {
      "strategy": "getByRole('button', { name: '招待' })",
      "confidence": 0.8,
      "i18nKey": "team.invite"
    }
  },
  "i18nKeys": ["team.title", "team.invite", "team.role.admin"],
  "interactiveElements": ["button:invite", "table:members", "select:role"],
  "testCoverage": "none"
}
```

**Selector generation rules:**
1. If an i18n key resolves to Japanese text → `getByRole('button/link/tab', { name: '日本語テキスト' })`
2. If element has placeholder text → `getByPlaceholder('プレースホルダー')`
3. If element is a Mantine component → consult `mantine-v8.md` guide
4. Assign confidence 0.7-0.8 for generated selectors (not yet verified)
5. Higher confidence (0.9+) only after a test actually passes using the selector

### Step 4: Report Changes

Show what was added/updated:
- New pages discovered
- Pages with updated components
- Uncovered pages (candidates for test generation)
- Any stale pages (route removed but still in map)

### Step 5: Clean Up

- Remove `.test-memory/.pending-scan` flag if it exists
- Update `changelog.md`

## Important Rules

- **Never delete existing keySelectors** — they may have been manually verified
- **Never overwrite manually set testCoverage** of "full" — it means human-verified
- **Preserve failHistory** in selectors.json — that's institutional memory
- **Set confidence ≤ 0.8** for auto-generated selectors — only verification raises it
- **Log everything** in changelog.md — this is the audit trail
```

- [ ] **Step 2: Commit**

```bash
cd /tmp/ai-test-engine-plugin
git add agents/
git commit -m "feat: add Product Expert agent"
```

---

## Task 5: Create `generate-tests` Skill

**Files:**
- Create: `ai-test-engine-plugin/skills/generate-tests/SKILL.md`

- [ ] **Step 1: Create `skills/generate-tests/SKILL.md`**

```markdown
---
name: generate-tests
description: Generate Playwright .spec.new.ts test files from product-map + patterns + selectors memory
---

# generate-tests Skill

Generate Playwright E2E test files for pages that lack test coverage.

## Prerequisites

- `.test-memory/product-map.json` must exist and be enriched (run Product Expert first)
- `.test-memory/patterns.md` must exist
- `.test-memory/selectors.json` must exist

## Input

- `target` — which pages to generate tests for:
  - `all-uncovered` — all pages with `testCoverage: "none"`
  - `{page-id}` — specific page (e.g., `team`)
  - `{module}` — all pages in a module (e.g., `bot-*`)

## Execution Steps

### 1. Load Memory

Read all three memory files:
- `product-map.json` → page structure, components, i18n keys, keySelectors
- `patterns.md` → test patterns to follow, anti-patterns to avoid
- `selectors.json` → existing verified selectors (reuse where possible)

### 2. Select Target Pages

Based on `target`, filter pages from product-map.json where `testCoverage` is `"none"` or `"partial"`.

### 3. Determine Test Level per Page

Apply the spec's level assignment rules:

| Condition | Test Level | Description |
|-----------|-----------|-------------|
| Any page | @L1 | Reachability — page loads, key elements visible |
| Page has forms | @L3 | Validation — form submit, error messages |
| Page has CRUD | @L2 | Operations — create, read, update, delete |
| Page has table/list | @L2 | Data display — table renders, sort, filter |
| Multi-step workflow | @L4 | Workflow — end-to-end flow |
| Edge cases | @L5 | Edge — boundary values, error states |

### 4. Generate Test File

For each target page, generate a `.spec.new.ts` file:

**File naming**: `tests/{page-id}.spec.new.ts`

**Template structure**:

```typescript
import { test, expect } from '@playwright/test';
import { login, navigateToBot } from './helpers/auth';

test.describe('{PageTitle} @{tag}', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to the page under test
    {navigationCode}
  });

  // @L1 — Reachability test (always generated)
  test('{pageTitle}ページ表示 @L1 @{priority}', async ({ page }) => {
    // Verify page loaded
    await expect(page).toHaveURL(/{urlPattern}/);

    // Verify key elements are visible
    {keyElementAssertions}
  });

  // @L2 — CRUD test (if page has CRUD)
  // @L3 — Form validation test (if page has forms)
  // etc.
});
```

**Selector strategy** (in priority order):
1. Reuse verified selector from `selectors.json` (confidence ≥ 0.9)
2. Use keySelector from `product-map.json` (confidence ≥ 0.7)
3. Generate new selector following `patterns.md` rules:
   - `getByRole()` + Japanese label from i18n (preferred)
   - `getByPlaceholder()` for form inputs
   - `getByText({ exact: true })` for text elements
   - `evaluate()` for inaccessible elements (last resort)

**Must follow these patterns from patterns.md:**
- `search-before-click` — use search box before clicking list items
- `networkidle-for-navigation` — `waitForLoadState('networkidle')` after page load
- `timestamp-test-data` — `E2E_{Module}_${Date.now()}` for test data names
- `mantine-tab-full-text` — use full tab label text
- `placeholder-over-position` — use placeholder, not positional index
- `no-space-in-japanese-particles` — no space before を、が、は

**Must avoid these anti-patterns from patterns.md:**
- `waitForTimeout-overuse` — use explicit waits instead
- `catch-false-pattern` — use `expect().toBeVisible()` for required elements

### 5. Add Generated Selectors to selectors.json

For each new selector used in generated tests:
- Add to `selectors.json` with confidence 0.7 (unverified)
- Set `lastVerified` to empty string (never verified)
- Note `"source": "generated"` in metadata

### 6. Determine Priority

Assign test priority based on page importance:
- **@P0**: Core user journey pages (bot list, chat, settings, datasets)
- **@P1**: Supporting features (team, account, API keys, dictionary)
- **@P2**: Administrative/secondary features (admin console, org collaboration)

### 7. Output

Save generated files as `tests/{page-id}.spec.new.ts` (NOT `.spec.ts`).

Report:
```
📝 Tests Generated
==================
✅ team.spec.new.ts — 3 tests (@L1 reachability, @L2 member list, @L3 invite form)
✅ account.spec.new.ts — 2 tests (@L1 reachability, @L3 profile edit)
✅ bot-tools.spec.new.ts — 2 tests (@L1 reachability, @L2 tool list)

⚠️ Low-confidence selectors (need manual verification):
  - team: getByRole('button', { name: '招待' }) — confidence 0.7
  - account: getByPlaceholder('メールアドレス') — confidence 0.7

Next: Run /test-run to verify generated tests, then rename .spec.new.ts → .spec.ts
```
```

- [ ] **Step 2: Commit**

```bash
cd /tmp/ai-test-engine-plugin
git add skills/generate-tests/
git commit -m "feat: add generate-tests skill"
```

---

## Task 6: Create Test Generator Agent

**Files:**
- Create: `ai-test-engine-plugin/agents/test-generator.md`

- [ ] **Step 1: Create `agents/test-generator.md`**

```markdown
---
name: test-generator
description: Generates Playwright E2E test files from product knowledge, patterns, and selector memory. Produces .spec.new.ts files for user review.
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
model: sonnet
color: green
---

# Test Generator Agent

You generate Playwright E2E test files based on the project's product knowledge, learned patterns, and verified selectors.

## When You Are Invoked

1. User invokes `/test-gen` (with optional target: module name, page id, or `--all`)
2. After Product Expert updates product-map.json

## Your Workflow

### Step 1: Load Context

1. Read `.test-memory/product-map.json` — which pages exist and their structure
2. Read `.test-memory/patterns.md` — how to write reliable tests
3. Read `.test-memory/selectors.json` — verified selectors to reuse
4. Read `references/playwright-patterns.md` — general best practices
5. Read `references/ui-framework-guides/mantine-v8.md` — Mantine selector strategies
6. Read existing test files in `tests/` — match the project's test style

### Step 2: Identify Targets

1. If user specified a target → generate for that page/module
2. If `--all` → generate for all pages with `testCoverage: "none"`
3. Sort by priority: P0 pages first, then P1, then P2

### Step 3: Study Existing Tests

Before generating, read 2-3 existing test files to learn the project's conventions:
- How `beforeEach` is structured
- How navigation is done
- What assertion patterns are used
- What test data naming convention is used
- What cleanup patterns are used

This ensures generated tests match the existing style.

### Step 4: Invoke generate-tests Skill

Follow the `generate-tests` skill instructions to:
- Determine test levels per page
- Generate test code
- Apply patterns and avoid anti-patterns
- Add new selectors to memory

### Step 5: Verify Generated Tests

After generating each file:
1. Read the generated `.spec.new.ts` to sanity-check it
2. Verify imports are correct (`@playwright/test`, helpers)
3. Verify selectors use known patterns
4. Verify test data uses timestamp naming
5. Verify cleanup is included for CRUD tests

### Step 6: Report

Show what was generated and suggest next steps:
- List of generated files with test counts
- Any low-confidence selectors that need verification
- Suggest: "Run `/test-run` on generated tests to verify, then rename `.spec.new.ts` → `.spec.ts`"

## Important Rules

- **Never overwrite existing `.spec.ts` files** — always use `.spec.new.ts`
- **Match existing test style** — read existing tests first and mimic conventions
- **Use verified selectors** from selectors.json when available (confidence ≥ 0.9)
- **Flag low-confidence selectors** — anything generated without verification gets confidence 0.7
- **Include cleanup** — any test that creates data must also delete it
- **Japanese test names** — test descriptions are in Japanese (e.g., `チーム管理ページ表示`)
- **Tag all tests** — every test must have @L and @P tags
```

- [ ] **Step 2: Commit**

```bash
cd /tmp/ai-test-engine-plugin
git add agents/test-generator.md
git commit -m "feat: add Test Generator agent"
```

---

## Task 7: Create `/test-gen` Command

**Files:**
- Create: `ai-test-engine-plugin/commands/test-gen.md`

- [ ] **Step 1: Create `commands/test-gen.md`**

```markdown
---
description: Generate E2E tests for uncovered pages using product knowledge and learned patterns
argument-hint: [page-id | module | --all]
---

# /test-gen — Generate Tests

Generate Playwright E2E test files from the product map and learned patterns.

## Usage

- `/test-gen` — Generate tests for all uncovered pages
- `/test-gen team` — Generate tests for the team page
- `/test-gen bot-*` — Generate tests for all bot sub-pages
- `/test-gen --refresh` — Re-scan codebase first, then generate

## Behavior

1. **Check product-map freshness**:
   - If product-map.json has fewer than 15 pages → suggest running Product Expert first
   - If `--refresh` flag → invoke Product Expert agent to re-scan codebase

2. **Invoke Test Generator agent** with the specified target

3. **Show generated files** and suggest verification:
   - "Generated 3 test files as `.spec.new.ts`"
   - "Run `/test-run team.spec.new.ts` to verify"
   - "When satisfied, rename: `mv tests/team.spec.new.ts tests/team.spec.ts`"

## Prerequisites

- Run `/test-init` first if `.test-memory/` doesn't exist
- Product Expert should have scanned the codebase (product-map.json is enriched)
```

- [ ] **Step 2: Commit**

```bash
cd /tmp/ai-test-engine-plugin
git add commands/test-gen.md
git commit -m "feat: add /test-gen command"
```

---

## Task 8: Update plugin.json with New Components

**Files:**
- Modify: `ai-test-engine-plugin/.claude-plugin/plugin.json`

- [ ] **Step 1: Update `plugin.json`**

The Phase 0 plugin.json used simplified directory paths. Phase 1 adds the agents directory and bumps the version. We keep the directory-path convention (consistent with how Claude Code Plugin system resolves agents/skills/commands from directories):

```json
{
  "name": "ai-test-engine",
  "description": "Intelligent self-healing E2E test system with persistent memory",
  "version": "0.2.0",
  "author": {
    "name": "Sparticle Inc",
    "email": "rh.li@sparticle.com"
  },
  "repository": "https://github.com/sparticleinc/ai-test-engine-plugin",
  "license": "MIT",
  "agents": "./agents/",
  "skills": "./skills/",
  "commands": "./commands/",
  "hooks": "./hooks/hooks.json"
}
```

Key changes:
- Version bump `0.1.0` → `0.2.0`
- Add `"agents": "./agents/"` (new for Phase 1 — Claude Code auto-discovers .md files in this directory)

Note: The spec §2.1 shows an explicit array format for agents/skills. However, the actual Claude Code Plugin system supports directory-path shorthand (as used by all official plugins like superpowers). Both formats work; directory paths are simpler and auto-discover new files.

- [ ] **Step 2: Commit**

```bash
cd /tmp/ai-test-engine-plugin
git add .claude-plugin/plugin.json
git commit -m "feat: add agents directory and bump version to 0.2.0"
```

---

## Task 9: Run Product Expert — Enrich product-map.json

This task is **manual execution**, not file creation. The subagent should act as the Product Expert and actually scan the frontend codebase.

**Files:**
- Modify: `StagingTest/.test-memory/product-map.json`
- Modify: `StagingTest/.test-memory/selectors.json`
- Modify: `StagingTest/.test-memory/changelog.md`

- [ ] **Step 1: Read the frontend routes file**

```bash
cat /Users/lirh2025/Desktop/featureM/mygpt-frontend-prod_1014/apps/admin/src/routes/index.tsx
```

Extract all routes and their component paths.

- [ ] **Step 2: Scan page components for interactive elements**

For each undocumented page (team, account, collaborative, bot sub-pages), read the page component file:

```bash
# Example for team page
cat /Users/lirh2025/Desktop/featureM/mygpt-frontend-prod_1014/apps/admin/src/pages/Team/index.tsx
```

Identify: forms, buttons, tables, tabs, modals, CRUD operations, i18n keys used.

- [ ] **Step 3: Parse i18n for relevant keys**

```bash
# Search for keys used by discovered pages
grep -n "team\." /Users/lirh2025/Desktop/featureM/mygpt-frontend-prod_1014/packages/app/locales/ja/translations.json | head -20
```

- [ ] **Step 4: Update product-map.json**

Add all discovered pages to `.test-memory/product-map.json`. Each new page entry should have:
- `id`, `path`, `title` (from i18n)
- `components` (from scanning page file)
- `keySelectors` (generated from i18n text + Mantine v8 guide)
- `i18nKeys` (from `t()` calls in component)
- `testCoverage`: `"none"` for new pages

Also update `framework.ui` from `"mantine-7"` to `"mantine-8"` (corrected version).

- [ ] **Step 5: Update selectors.json with new page selectors**

For each new page, add key element selectors to `selectors.json` with:
- `confidence: 0.7` (unverified)
- `lastVerified: ""` (never verified)

- [ ] **Step 6: Update changelog.md**

Append: `- 2026-03-20: analyze: Product Expert scanned codebase, added N new pages`

- [ ] **Step 7: Commit**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
git add .test-memory/
git commit -m "feat: enrich product-map with Product Expert scan (Phase 1)"
```

---

## Task 10: Run Test Generator — Generate Tests for 3+ Uncovered Pages

This task is **manual execution**. The subagent should act as the Test Generator and generate test files.

**Files:**
- Create: `StagingTest/tests/team.spec.new.ts`
- Create: `StagingTest/tests/account.spec.new.ts`
- Create: `StagingTest/tests/bot-tools.spec.new.ts`
- Modify: `StagingTest/.test-memory/selectors.json` (add new selectors)
- Modify: `StagingTest/.test-memory/changelog.md`

Target pages (choose 3+ with highest testability):
1. **Team** (`/team`) — member list, invite flow
2. **Account** (`/account`) — profile settings, account info
3. **Bot Tools** (`/bot/:id/tools`) — tools configuration page

- [ ] **Step 1: Study existing test conventions**

Read 2-3 existing test files to learn the project's style:
```bash
cat tests/bot-settings.spec.ts
cat tests/navigation.spec.ts
cat tests/bot-management.spec.ts
```

- [ ] **Step 2: Read target page components**

For each target page, read the actual page component to understand what's on the page:
```bash
cat /Users/lirh2025/Desktop/featureM/mygpt-frontend-prod_1014/apps/admin/src/pages/Team/index.tsx
cat /Users/lirh2025/Desktop/featureM/mygpt-frontend-prod_1014/apps/admin/src/pages/Account/index.tsx
```

- [ ] **Step 3: Generate test files**

Create each `.spec.new.ts` file following:
- Existing test style (imports, beforeEach, assertion patterns)
- patterns.md (verified patterns)
- mantine-v8.md (selector strategies)
- product-map.json keySelectors
- Japanese test names with @L and @P tags

Minimum per page:
- 1 × @L1 reachability test (page loads, key elements visible)
- 1+ additional tests based on page type (form validation, list display, etc.)

- [ ] **Step 4: Run generated tests**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
npx playwright test tests/team.spec.new.ts tests/account.spec.new.ts tests/bot-tools.spec.new.ts --reporter=line
```

Target: >80% pass rate. Failures due to selector issues are acceptable if test structure is correct.

- [ ] **Step 5: Fix failing tests if possible**

If any tests fail:
1. Read the error message
2. Take a screenshot or read the DOM if needed
3. Fix the selector using the actual DOM structure
4. Re-run until passing or document remaining failures

- [ ] **Step 6: Update selectors.json with verified selectors**

For selectors that were verified by passing tests:
- Update `confidence` to 0.95
- Set `lastVerified` to today's date

For selectors that failed and were fixed:
- Add to `failHistory`
- Update to new working selector

- [ ] **Step 7: Commit**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
git add tests/*.spec.new.ts .test-memory/
git commit -m "feat: generate tests for team, account, bot-tools pages (Phase 1)"
```

---

## Task 11: Verification Gate

- [ ] **Step 1: Verify plugin repo structure**

```bash
cd /tmp/ai-test-engine-plugin
find . -not -path './.git/*' -type f | sort
```

Expected new files (in addition to Phase 0):
```
./agents/product-expert.md
./agents/test-generator.md
./commands/test-gen.md
./references/ui-framework-guides/mantine-v8.md
./skills/analyze-codebase/SKILL.md
./skills/generate-tests/SKILL.md
```

- [ ] **Step 2: Verify product-map enrichment**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
python3 -c "
import json
with open('.test-memory/product-map.json') as f:
    pm = json.load(f)
pages = pm['pages']
print(f'Total pages: {len(pages)}')
none = [p['id'] for p in pages if p['testCoverage'] == 'none']
partial = [p['id'] for p in pages if p['testCoverage'] == 'partial']
full = [p['id'] for p in pages if p['testCoverage'] == 'full']
print(f'Coverage: {len(full)} full, {len(partial)} partial, {len(none)} none')
print(f'Uncovered: {none[:5]}...' if len(none) > 5 else f'Uncovered: {none}')
"
```

Expected: Total pages ≥ 20 (was 12 in Phase 0)

- [ ] **Step 3: Verify generated tests exist and pass**

```bash
ls tests/*.spec.new.ts
npx playwright test tests/*.spec.new.ts --reporter=line
```

Expected: ≥3 files, >80% pass rate

- [ ] **Step 4: Verify original 33 tests still pass**

```bash
npx playwright test --grep-invert "spec.new" --reporter=line
```

Expected: 33 passed (no regressions)

- [ ] **Step 5: Push everything**

```bash
# Push plugin updates
cd /tmp/ai-test-engine-plugin
git push origin main

# Push project updates
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
git add -A
git commit -m "docs: add Phase 1 implementation plan"
git push origin main
```

---

## Summary

| Task | What | Where |
|------|------|-------|
| 1 | Update .test-config.json with frontendPath | StagingTest |
| 2 | Create Mantine v8 selector guide | Plugin |
| 3 | Create analyze-codebase skill | Plugin |
| 4 | Create Product Expert agent | Plugin |
| 5 | Create generate-tests skill | Plugin |
| 6 | Create Test Generator agent | Plugin |
| 7 | Create /test-gen command | Plugin |
| 8 | Update plugin.json (version + agents) | Plugin |
| 9 | **Execute** Product Expert scan | StagingTest memory |
| 10 | **Execute** Test Generator + verify | StagingTest tests |
| 11 | Verification gate | Both repos |
