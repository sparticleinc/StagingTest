# Phase 0: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the ai-test-engine-plugin skeleton with initial memory extracted from existing 33 tests, and a working `/test-run` command.

**Architecture:** Claude Code Plugin with `.claude-plugin/plugin.json` manifest. Plugin lives in its own Git repo (`sparticleinc/ai-test-engine-plugin`). Project-level memory (`.test-memory/`) lives in the test project repo (`sparticleinc/StagingTest`), which is located at `/Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine/` (has its own `.git` — it was pushed to GitHub as a standalone repo, even though it's nested inside SalesRoom2). Phase 0 delivers the plugin skeleton + initial memory + one working command.

**Note on plugin.json schema:** Phase 0 uses a simplified manifest (directory-path style). The spec's full schema with named agent/skill arrays will be adopted in Phase 1 when agents are introduced. Phase 0 has no agents — only commands, skills, and hooks.

**Tech Stack:** Claude Code Plugin system (Markdown skills/agents/commands, JSON hooks), Playwright (test runner), Node.js (hook scripts)

**Spec:** `docs/specs/2025-03-20-ai-test-engine-plugin-design.md`

---

## File Structure

### Plugin Repo (`sparticleinc/ai-test-engine-plugin`)

```
ai-test-engine-plugin/
├── .claude-plugin/
│   └── plugin.json                 # Plugin manifest (required by Claude Code)
├── commands/
│   ├── test-init.md                # /test-init — initialize .test-memory/ in project
│   ├── test-run.md                 # /test-run — execute Playwright tests
│   └── test-status.md              # /test-status — show memory & test health
├── skills/
│   └── run-tests/
│       └── SKILL.md                # Execute tests + parse results
├── hooks/
│   └── hooks.json                  # SessionStart hook (load memory context)
├── memory/
│   ├── selectors.template.json     # Template for project selectors.json
│   ├── patterns.template.md        # Template for project patterns.md
│   ├── product-map.template.json   # Template for project product-map.json
│   └── test-history.template.json  # Template for project test-history.json
├── references/
│   └── playwright-patterns.md      # Cross-project Playwright best practices
├── README.md
└── .gitignore
```

### Project Repo additions (`sparticleinc/StagingTest`)

```
StagingTest/
├── .test-memory/                   # NEW — project-specific memory
│   ├── selectors.json              # Extracted from existing 33 tests
│   ├── patterns.md                 # Extracted from debug experience
│   ├── product-map.json            # Minimal initial map
│   ├── test-history.json           # Empty initial history
│   └── changelog.md                # Memory change log
└── .test-config.json               # NEW — plugin config for this project
```

---

## Task 1: Create Plugin Repo + Manifest

**Files:**
- Create: `ai-test-engine-plugin/.claude-plugin/plugin.json`
- Create: `ai-test-engine-plugin/.gitignore`
- Create: `ai-test-engine-plugin/README.md`

- [ ] **Step 1: Create GitHub repo**

```bash
cd /tmp
mkdir ai-test-engine-plugin && cd ai-test-engine-plugin
git init
```

- [ ] **Step 2: Create `.claude-plugin/plugin.json`**

```json
{
  "name": "ai-test-engine",
  "description": "Intelligent self-healing E2E test system with persistent memory",
  "version": "0.1.0",
  "author": {
    "name": "Sparticle Inc",
    "email": "rh.li@sparticle.com"
  },
  "repository": "https://github.com/sparticleinc/ai-test-engine-plugin",
  "license": "MIT",
  "skills": "./skills/",
  "commands": "./commands/",
  "hooks": "./hooks/hooks.json"
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
.env
.DS_Store
*.log
```

- [ ] **Step 4: Create `README.md`**

```markdown
# AI Test Engine — Claude Code Plugin

Intelligent self-healing E2E test system with persistent memory. Understands your product, generates Playwright tests, automatically repairs broken tests, and learns from every debug session.

## Installation

\`\`\`bash
claude plugin add sparticleinc/ai-test-engine-plugin
\`\`\`

## Commands

| Command | Description |
|---------|-------------|
| `/test-init` | Initialize `.test-memory/` in your project |
| `/test-run` | Run tests (all, by tag, by file) |
| `/test-run @smoke` | Run smoke tests only |
| `/test-status` | Show memory stats and test health |
| `/test-gen` | Generate tests from codebase (Phase 1) |
| `/test-heal` | Auto-fix failing tests (Phase 2) |
| `/test-review` | Quality review + recommendations (Phase 3) |

## How It Works

The plugin maintains a `.test-memory/` directory in your project with three layers of knowledge:

1. **Selectors** (`selectors.json`) — Best Playwright selector for each UI element, with fallbacks and failure history
2. **Patterns** (`patterns.md`) — Reusable test patterns and anti-patterns learned from debugging
3. **Product Map** (`product-map.json`) — Page structure, routes, components, and test coverage

Every test run, heal, and review enriches this memory. The more you use it, the smarter it gets.

## License

MIT
\`\`\`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize plugin skeleton with manifest"
```

---

## Task 2: Create Memory Templates

**Files:**
- Create: `ai-test-engine-plugin/memory/selectors.template.json`
- Create: `ai-test-engine-plugin/memory/patterns.template.md`
- Create: `ai-test-engine-plugin/memory/product-map.template.json`
- Create: `ai-test-engine-plugin/memory/test-history.template.json`

- [ ] **Step 1: Create `selectors.template.json`**

```json
{
  "version": "1.0",
  "lastUpdated": "",
  "elements": {}
}
```

- [ ] **Step 2: Create `patterns.template.md`**

```markdown
# Test Patterns — Learned from Experience

## Verified Patterns

(No patterns yet — they will be added as tests are debugged and fixed.)

## Known Anti-Patterns

(No anti-patterns recorded yet.)
```

- [ ] **Step 3: Create `product-map.template.json`**

```json
{
  "version": "1.0",
  "lastUpdated": "",
  "app": "",
  "baseUrl": "",
  "framework": {
    "ui": "",
    "router": "",
    "i18n": "",
    "state": ""
  },
  "pages": [],
  "flows": []
}
```

- [ ] **Step 4: Create `test-history.template.json`**

```json
{
  "runs": [],
  "summary": {
    "totalRuns": 0,
    "overallPassRate": 0,
    "perTest": {}
  },
  "healHistory": []
}
```

- [ ] **Step 5: Commit**

```bash
git add memory/
git commit -m "feat: add memory templates for project initialization"
```

---

## Task 3: Extract Initial Selectors from Existing Tests

**Files:**
- Create: `StagingTest/.test-memory/selectors.json`

This is the most important task — we extract every selector strategy used in the 33 existing tests and record them with the lessons learned.

- [ ] **Step 1: Create `selectors.json` with complete extracted data**

Create `.test-memory/selectors.json` with all selectors from the 14 test files + auth helper. The full content:

```json
{
  "version": "1.0",
  "lastUpdated": "2026-03-20",
  "elements": {
    "auth.email-input": {
      "selector": "getByRole('textbox', { name: 'アカウント' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.98,
      "lastVerified": "2026-03-20"
    },
    "auth.password-input": {
      "selector": "getByRole('textbox', { name: 'パスワード' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.98,
      "lastVerified": "2026-03-20"
    },
    "auth.login-button": {
      "selector": "getByRole('button', { name: 'ログイン' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.98,
      "lastVerified": "2026-03-20"
    },
    "bot-list.welcome-text": {
      "selector": "getByText('GBaseへようこそ')",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.99,
      "lastVerified": "2026-03-20"
    },
    "bot-list.search-box": {
      "selector": "getByRole('textbox', { name: 'ボットを検索...' })",
      "alternatives": ["getByPlaceholder('ボットを検索...')"],
      "failHistory": [],
      "confidence": 0.98,
      "lastVerified": "2026-03-20"
    },
    "bot-list.create-button": {
      "selector": "getByText('AIアシスタントを作成しています')",
      "alternatives": [],
      "failHistory": [
        { "date": "2026-03-18", "oldSelector": "getByText('ボットを作成')", "reason": "UI button text is full sentence, not short label" }
      ],
      "confidence": 0.90,
      "lastVerified": "2026-03-20"
    },
    "bot-list.create-dialog": {
      "selector": "getByRole('dialog', { name: 'AIアシスタントを作成しています' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.95,
      "lastVerified": "2026-03-20"
    },
    "bot-list.create-name-input": {
      "selector": "getByRole('textbox', { name: '名前' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.95,
      "lastVerified": "2026-03-20"
    },
    "bot-list.create-desc-input": {
      "selector": "getByRole('textbox', { name: '説明' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.95,
      "lastVerified": "2026-03-20"
    },
    "bot-list.create-ok-button": {
      "selector": "getByRole('button', { name: 'OK' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.95,
      "lastVerified": "2026-03-20"
    },
    "bot-list.create-cancel-button": {
      "selector": "getByRole('button', { name: 'キャンセル' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.95,
      "lastVerified": "2026-03-20"
    },
    "bot-card.menu-button": {
      "selector": "evaluate(() => { let c = el.parentElement; while(c) { const btn = c.querySelector('button'); if(btn) { btn.click(); return; } c = c.parentElement; } })",
      "alternatives": [],
      "failHistory": [
        { "date": "2026-03-18", "oldSelector": "locator('xpath=../..').locator('button')", "reason": "xpath chaining unreliable in Playwright for Mantine card components" }
      ],
      "confidence": 0.95,
      "lastVerified": "2026-03-20",
      "note": "Mantine card action button has no accessible name. DOM traversal via evaluate() is the only reliable method."
    },
    "bot-card.delete-menuitem": {
      "selector": "getByRole('menuitem', { name: '削除' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.95,
      "lastVerified": "2026-03-20"
    },
    "bot-card.delete-dialog-title": {
      "selector": "getByText('チャットボットを削除する')",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.95,
      "lastVerified": "2026-03-20"
    },
    "bot-card.delete-confirm-button": {
      "selector": "getByRole('button', { name: '削除' }).last()",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.95,
      "lastVerified": "2026-03-20",
      "note": "Must use .last() because first '削除' is the menu item, last is the dialog confirm button"
    },
    "nav.knowledgebase-link": {
      "selector": "getByRole('link', { name: 'ナレッジベース' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.98,
      "lastVerified": "2026-03-20"
    },
    "nav.mybot-link": {
      "selector": "getByRole('link', { name: 'マイボット' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.98,
      "lastVerified": "2026-03-20"
    },
    "nav.workspace-sparticle": {
      "selector": "locator('text=Sparticle').last()",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.85,
      "lastVerified": "2026-03-20",
      "note": "Workspace switcher uses text locator with .last() due to multiple Sparticle text occurrences"
    },
    "nav.workspace-personal": {
      "selector": "locator('text=個人').last()",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.85,
      "lastVerified": "2026-03-20"
    },
    "bot-settings.tab-general": {
      "selector": "getByRole('tab', { name: '一般設定' })",
      "alternatives": [],
      "failHistory": [
        { "date": "2026-03-20", "oldSelector": "getByText('一般', { exact: true })", "reason": "Mantine Tab renders full text '一般設定' not just '一般'" }
      ],
      "confidence": 0.97,
      "lastVerified": "2026-03-20"
    },
    "bot-settings.tab-advanced": {
      "selector": "getByRole('tab', { name: '詳細設定' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.97,
      "lastVerified": "2026-03-20"
    },
    "bot-settings.tab-prompt": {
      "selector": "getByRole('tab', { name: 'プロンプト' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.97,
      "lastVerified": "2026-03-20"
    },
    "bot-settings.tab-delete": {
      "selector": "getByRole('tab', { name: 'ボット削除' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.97,
      "lastVerified": "2026-03-20"
    },
    "bot-settings.name-input": {
      "selector": "getByPlaceholder('チャットボットの名前を入力してください')",
      "alternatives": ["getByRole('textbox').nth(1)"],
      "failHistory": [
        { "date": "2026-03-20", "oldSelector": "getByRole('textbox').first()", "reason": "first() hits the readonly bot ID field instead of the editable name field" }
      ],
      "confidence": 0.97,
      "lastVerified": "2026-03-20"
    },
    "bot-chat.input": {
      "selector": "getByRole('textbox', { name: 'こちらにメッセージを入力してください...' })",
      "alternatives": ["getByRole('textbox').first()"],
      "failHistory": [],
      "confidence": 0.90,
      "lastVerified": "2026-03-20"
    },
    "bot-chat.share-button": {
      "selector": "getByRole('button', { name: '共有' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.90,
      "lastVerified": "2026-03-20"
    },
    "dataset-list.search-box": {
      "selector": "getByRole('textbox', { name: 'ナレッジベース名を検索' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.95,
      "lastVerified": "2026-03-20"
    },
    "dataset-list.create-button": {
      "selector": "getByRole('button', { name: 'ナレッジベースの作成' })",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.95,
      "lastVerified": "2026-03-20"
    },
    "dataset-detail.file-tab": {
      "selector": "getByText('ファイルとドキュメント').first()",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.85,
      "lastVerified": "2026-03-20"
    },
    "dataset-detail.website-tab": {
      "selector": "getByText('ウェブサイト').first()",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.85,
      "lastVerified": "2026-03-20"
    },
    "api-keys.create-button": {
      "selector": "getByRole('button', { name: /新規キーを作成|作成/ }).first()",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.85,
      "lastVerified": "2026-03-20",
      "note": "Uses regex because button text may vary"
    },
    "dictionary.add-button": {
      "selector": "getByRole('button', { name: /追加|新規/ }).first()",
      "alternatives": [],
      "failHistory": [],
      "confidence": 0.85,
      "lastVerified": "2026-03-20"
    },
    "not-found.secret-text": {
      "selector": "getByText('あなたは秘密の場所を見つけました')",
      "alternatives": ["getByText('404')"],
      "failHistory": [],
      "confidence": 0.90,
      "lastVerified": "2026-03-20",
      "note": "404 page may show Japanese text OR '404' number. Use .isVisible().catch(() => false) to check both."
    }
  }
}
```

- [ ] **Step 2: Verify selectors.json is valid JSON**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
mkdir -p .test-memory
cat .test-memory/selectors.json | python3 -m json.tool > /dev/null && echo "Valid JSON"
```

Note: `.test-memory/` directory is created here. Remaining memory files (product-map, test-history, changelog) are created in Task 5. Do NOT commit until Task 5 completes — all memory files are committed together in Task 12.

---

## Task 4: Extract Initial Patterns from Debug Experience

**Files:**
- Create: `StagingTest/.test-memory/patterns.md`

- [ ] **Step 1: Create `patterns.md` with battle-tested patterns**

Extract from our actual debugging sessions (all of these were discovered and verified):

```markdown
# Test Patterns — Learned from Experience

## Verified Patterns

### search-before-click
- **Scenario**: Clicking an item in a list where the target may be off-screen
- **Approach**: Use the page's search box to filter → `waitForTimeout(1000)` → `getByText(name, { exact: true }).first().click()`
- **Anti-pattern**: Direct `getByText(name).click()` without filtering — fails when orphaned test data pushes target below viewport
- **Learned from**: BDD_Test_Agent was pushed off-screen by 8 orphaned E2E bots. 8 tests failed with timeout.
- **Applies to**: Any list page with a search box (bot list, dataset list, dictionary)

### evaluate-for-sibling-buttons
- **Scenario**: Need to click a button adjacent to a text element (e.g., bot card menu button)
- **Approach**: `element.evaluate(el => { let c = el.parentElement; while(c) { const btn = c.querySelector('button'); if(btn) { btn.click(); return; } c = c.parentElement; } })`
- **Anti-pattern**: `locator('xpath=../..').locator('button')` — xpath chaining is unreliable in Playwright
- **Learned from**: Bot CRUD delete flow, xpath approach caused persistent timeouts
- **Applies to**: Mantine Card components where action buttons have no accessible name

### mantine-tab-full-text
- **Scenario**: Selecting Mantine UI Tab components
- **Approach**: `getByRole('tab', { name: '一般設定' })` — use the full tab label text
- **Anti-pattern**: `getByText('一般', { exact: true })` — Mantine renders full text like "一般設定", not just "一般"
- **Learned from**: bot-settings.spec.ts tab test — "一般" not found because actual text is "一般設定"
- **Applies to**: All Mantine Tab components (universal for Mantine v7)

### placeholder-over-position
- **Scenario**: Targeting a specific input field when multiple textboxes exist
- **Approach**: `getByPlaceholder('チャットボットの名前を入力してください')` — use placeholder text
- **Anti-pattern**: `getByRole('textbox').first()` — may hit a readonly field (e.g., bot ID field)
- **Learned from**: bot-settings name edit test — first() targeted the readonly bot ID field
- **Applies to**: Any form with multiple input fields, especially when some are readonly

### last-for-duplicate-buttons
- **Scenario**: Confirmation dialog has multiple buttons with the same label
- **Approach**: `getByRole('button', { name: '削除' }).last()` — confirmation button is typically last
- **Anti-pattern**: `.first()` may hit the menu item or header button instead of the dialog's confirm button
- **Learned from**: Bot delete confirmation dialog had two "削除" elements
- **Applies to**: Any destructive action confirmation dialog

### no-space-in-japanese-particles
- **Scenario**: Matching Japanese text that includes particles (を、が、は、etc.)
- **Approach**: No space before particles: `${name}を削除してもよろしいですか？`
- **Anti-pattern**: Adding a space before particles: `${name} を削除` — this is grammatically incorrect Japanese
- **Learned from**: Bot delete confirmation text matching failed with extra space
- **Applies to**: All Japanese UI text matching

### timestamp-test-data
- **Scenario**: Creating test data that must be unique and identifiable for cleanup
- **Approach**: `E2E_{Module}_${Date.now()}` — guaranteed unique, easily identifiable as test data
- **Anti-pattern**: Fixed names like "TestBot" — collides across parallel runs, hard to identify for cleanup
- **Learned from**: Standard pattern established during bot-crud test development
- **Applies to**: Any test that creates persistent data (bots, datasets, API keys, dictionary entries)

### networkidle-for-navigation
- **Scenario**: Waiting for a page to fully load after navigation
- **Approach**: `waitForLoadState('networkidle', { timeout: 15_000 })` for full page loads; `waitForURL()` for route changes
- **Anti-pattern**: `waitForTimeout(2000)` — arbitrary, either too short (flaky) or too long (slow)
- **Learned from**: Multiple tests had flaky behavior due to inconsistent page load times
- **Applies to**: All navigation actions (goto, click that changes route)

## Known Anti-Patterns

### waitForTimeout-overuse
- **Problem**: Excessive use of `waitForTimeout()` makes tests slow and still flaky
- **Alternative**: Use `waitForURL()`, `waitForLoadState()`, or `expect().toBeVisible()` with timeout
- **Exception**: After search box `.fill()`, a 1-second wait is acceptable (server-side filtering delay)

### catch-false-pattern
- **Problem**: Using `.isVisible().catch(() => false)` for critical assertions
- **Alternative**: Use `expect().toBeVisible()` for required elements. Only use catch-false for optional/conditional checks (like 404 page text variants)
- **Example**: 404 test correctly uses catch-false because the page might show Japanese text OR "404" number OR redirect
```

Note: Do NOT commit yet — patterns.md will be committed with all memory files in Task 12.

---

## Task 5: Create Initial Product Map + Config

**Files:**
- Create: `StagingTest/.test-memory/product-map.json`
- Create: `StagingTest/.test-memory/test-history.json`
- Create: `StagingTest/.test-memory/changelog.md`
- Create: `StagingTest/.test-config.json`

- [ ] **Step 1: Create minimal `product-map.json`**

Based on what we know from the existing 33 tests (not a full codebase scan — that's Phase 1):

```json
{
  "version": "1.0",
  "lastUpdated": "2026-03-20T00:00:00Z",
  "app": "GBase Admin",
  "baseUrl": "https://admin-staging.gbase.ai",
  "framework": {
    "ui": "mantine-7",
    "router": "react-router-6",
    "i18n": "i18next",
    "state": "zustand"
  },
  "pages": [
    { "id": "auth", "path": "/auth/login", "title": "ログイン", "components": ["LoginForm"], "keySelectors": {}, "i18nKeys": [], "testCoverage": "full" },
    { "id": "bot-list", "path": "/bots", "title": "マイボット", "components": ["BotCard", "SearchBox", "CreateDialog"], "keySelectors": {}, "i18nKeys": [], "testCoverage": "full" },
    { "id": "bot-chat", "path": "/bot/:id/chat", "title": "チャット", "components": ["ChatInput", "MessageList"], "keySelectors": {}, "i18nKeys": [], "testCoverage": "partial" },
    { "id": "bot-settings", "path": "/bot/:id/settings", "title": "設定", "components": ["SettingsTabs", "NameInput", "DangerZone"], "keySelectors": {}, "i18nKeys": [], "testCoverage": "partial" },
    { "id": "bot-records", "path": "/bot/:id/records", "title": "チャット履歴", "components": [], "keySelectors": {}, "i18nKeys": [], "testCoverage": "partial" },
    { "id": "bot-dictionary", "path": "/bot/:id/dictionary", "title": "データ辞書", "components": ["TermList", "AddTermForm"], "keySelectors": {}, "i18nKeys": [], "testCoverage": "full" },
    { "id": "bot-dashboard", "path": "/bot/:id/dashboard", "title": "ダッシュボード", "components": [], "keySelectors": {}, "i18nKeys": [], "testCoverage": "partial" },
    { "id": "dataset-list", "path": "/datasets", "title": "ナレッジベース", "components": ["DatasetCard", "SearchBox", "CreateButton"], "keySelectors": {}, "i18nKeys": [], "testCoverage": "full" },
    { "id": "dataset-detail", "path": "/datasets/:id", "title": "ナレッジベース詳細", "components": ["FileTab", "WebsiteTab"], "keySelectors": {}, "i18nKeys": [], "testCoverage": "partial" },
    { "id": "api-keys", "path": "/api-keys", "title": "APIキー", "components": ["KeyList", "CreateDialog"], "keySelectors": {}, "i18nKeys": [], "testCoverage": "full" },
    { "id": "access-control", "path": "/access", "title": "アクセス管理", "components": [], "keySelectors": {}, "i18nKeys": [], "testCoverage": "partial" },
    { "id": "not-found", "path": "/*", "title": "404", "components": [], "keySelectors": {}, "i18nKeys": [], "testCoverage": "full" }
  ],
  "flows": [
    { "id": "bot-crud", "name": "ボット作成→削除", "steps": ["bot-list → createDialog → /create?botId=X → bot-list → delete"], "priority": "P0", "testCoverage": "full" },
    { "id": "bot-workflow", "name": "ボット作成→設定→チャット→削除", "steps": ["bot-list → createDialog → bot-settings → bot-chat → bot-list → delete"], "priority": "P0", "testCoverage": "full" }
  ]
}
```

- [ ] **Step 2: Create empty `test-history.json`**

```json
{
  "runs": [],
  "summary": {
    "totalRuns": 0,
    "overallPassRate": 0,
    "perTest": {}
  },
  "healHistory": []
}
```

- [ ] **Step 3: Create `changelog.md`**

```markdown
# Test Memory Changelog

- 2026-03-20: init: Initial memory extracted from 33 existing tests (Phase 0)
```

- [ ] **Step 4: Create `.test-config.json`**

```json
{
  "frontendPath": "",
  "frontendBranch": "prod_1014",
  "backendPath": "",
  "backendBranch": "staging",
  "testCommand": "npx playwright test",
  "baseUrl": "https://admin-staging.gbase.ai",
  "i18nPath": "src/locales/ja/translation.json",
  "routerConfigPath": "src/routes.tsx"
}
```

Note: `frontendPath` and `backendPath` are left empty for now — they will be set when the user clones the repos locally. The plugin should handle missing paths gracefully.

Note: Do NOT commit yet — all memory files + config will be committed together in Task 12.

---

## Task 6: Create `/test-init` Command

**Files:**
- Create: `ai-test-engine-plugin/commands/test-init.md`

- [ ] **Step 1: Create `commands/test-init.md`**

```markdown
---
description: Initialize .test-memory/ directory and .test-config.json in the current project
argument-hint: [--force]
---

# /test-init — Initialize Test Memory

Initialize the AI Test Engine memory for the current project.

## Steps

1. Check if `.test-memory/` already exists in the current working directory
   - If exists and `--force` not passed: warn user and stop
   - If exists and `--force` passed: back up existing to `.test-memory.bak/`

2. Create `.test-memory/` directory with template files:
   - Copy `selectors.template.json` → `.test-memory/selectors.json`
   - Copy `patterns.template.md` → `.test-memory/patterns.md`
   - Copy `product-map.template.json` → `.test-memory/product-map.json`
   - Copy `test-history.template.json` → `.test-memory/test-history.json`
   - Create `.test-memory/changelog.md` with init entry

3. Create `.test-config.json` by asking the user:
   - What is the test command? (default: `npx playwright test`)
   - What is the base URL? (try to detect from playwright.config.ts or .env)
   - Where is the frontend codebase? (optional, for Phase 1 test generation)

4. Add `.test-memory/` to `.gitignore` if not already present
   - Memory files should be committed (they are project knowledge)
   - But add `.test-memory/.pending-scan` to .gitignore (temp flag file)

5. Report:
   - "✅ Test memory initialized at .test-memory/"
   - "📋 Config saved to .test-config.json"
   - "Run /test-run to execute tests, /test-status to check memory health"
```

- [ ] **Step 2: Commit to plugin repo**

```bash
cd /tmp/ai-test-engine-plugin
git add commands/test-init.md
git commit -m "feat: add /test-init command"
```

---

## Task 7: Create `/test-run` Command + run-tests Skill

**Files:**
- Create: `ai-test-engine-plugin/commands/test-run.md`
- Create: `ai-test-engine-plugin/skills/run-tests/SKILL.md`

- [ ] **Step 1: Create `skills/run-tests/SKILL.md`**

```markdown
---
name: run-tests
description: Execute Playwright tests and parse results. Updates test-history.json after each run.
---

# run-tests Skill

Execute Playwright tests for the current project and record results in memory.

## Prerequisites

- `.test-memory/` must exist (run `/test-init` first)
- `.test-config.json` must exist with `testCommand` field
- Playwright must be installed (`npx playwright --version`)

## Execution Steps

1. **Read config**: Load `.test-config.json` to get `testCommand`

2. **Build command**: Based on arguments:
   - No args: `{testCommand}` (run all)
   - `@tag`: `{testCommand} --grep "@tag"` (filter by tag)
   - `filename`: `{testCommand} tests/{filename}` (specific file)
   - `--headed`: append `--headed` flag

3. **Run tests**: Execute the command via Bash tool
   - Use `--reporter=json` to get machine-readable output
   - Also use `--reporter=list` for human-readable console output
   - Capture both stdout and exit code

4. **Parse results**: From JSON reporter output, extract:
   - Total tests, passed, failed, flaky, skipped
   - Per-test: name, status, duration, error message (if failed)
   - Failed test artifacts: screenshot path, trace path, error-context.md path

5. **Update test-history.json**:
   - Append new run to `runs[]` array
   - If `runs[]` exceeds 30 entries, summarize oldest into `summary` and prune
   - Compute per-test pass rates in `summary.perTest`

6. **Report results**:
   - Summary line: "✅ 33/33 passed (20.4s)" or "❌ 2/33 failed"
   - For failures: show test name, error message, artifact paths
   - If flaky tests detected (>20% fail rate in last 10 runs): warn

7. **Return exit code**: 0 if all passed, 1 if any failed
```

- [ ] **Step 2: Create `commands/test-run.md`**

```markdown
---
description: Run E2E tests with optional filtering by tag, file, or pattern
argument-hint: [@smoke | @P0 | filename.spec.ts | --headed | --all]
---

# /test-run — Execute Tests

Run Playwright E2E tests for the current project.

## Usage

- `/test-run` — Run all tests
- `/test-run @smoke` — Run smoke tests only
- `/test-run @P0` — Run critical path tests
- `/test-run @L1` — Run level 1 (reachability) tests
- `/test-run bot-crud` — Run specific test file
- `/test-run --headed` — Run with browser visible (for debugging)

## Behavior

1. Invoke the `run-tests` skill with the provided arguments
2. Display results in a clear summary format
3. If tests fail, suggest running `/test-heal` to auto-fix
4. Update `.test-memory/test-history.json` with run results

## Prerequisites

Run `/test-init` first if `.test-memory/` doesn't exist.
```

- [ ] **Step 3: Commit**

```bash
git add skills/run-tests/ commands/test-run.md
git commit -m "feat: add /test-run command and run-tests skill"
```

---

## Task 8: Create `/test-status` Command

**Files:**
- Create: `ai-test-engine-plugin/commands/test-status.md`

- [ ] **Step 1: Create `commands/test-status.md`**

```markdown
---
description: Show test system health — memory stats, recent results, coverage
argument-hint:
---

# /test-status — System Health Dashboard

Display the current state of the AI Test Engine memory and test health.

## Behavior

1. **Check prerequisites**:
   - Is `.test-memory/` present? If not: "Run /test-init first"
   - Is `.test-config.json` present? If not: warn

2. **Read and display memory stats**:

### Selector Memory
- Read `.test-memory/selectors.json`
- Count: total elements, elements with confidence > 0.9, elements with confidence < 0.7
- Show any elements with `lastVerified` > 30 days as "stale"

### Pattern Memory
- Read `.test-memory/patterns.md`
- Count: verified patterns, known anti-patterns

### Product Map
- Read `.test-memory/product-map.json`
- Count: total pages, pages with testCoverage "full" / "partial" / "none"
- Count: total flows, flows with testCoverage

### Test History
- Read `.test-memory/test-history.json`
- Show: total runs, last run date, overall pass rate
- Show: flaky tests (if any, >20% fail rate in last 10 runs)
- Show: recent heal history (last 5 entries)

3. **Output format**:

```
🔬 AI Test Engine Status
========================
📊 Memory: 35 selectors (32 healthy, 3 stale) | 9 patterns | 12 pages mapped
📈 History: 15 runs | Last: 2026-03-20 | Pass rate: 97.2%
🩺 Health: 1 flaky test | 0 pending heals
📋 Coverage: 10/12 pages (83%) | 2/2 flows (100%)
```
```

- [ ] **Step 2: Commit**

```bash
git add commands/test-status.md
git commit -m "feat: add /test-status command"
```

---

## Task 9: Create SessionStart Hook

**Files:**
- Create: `ai-test-engine-plugin/hooks/hooks.json`

- [ ] **Step 1: Create `hooks/hooks.json`**

```json
{
  "description": "AI Test Engine hooks — inject memory context on session start",
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"const fs=require('fs');const p='.test-memory/';if(!fs.existsSync(p)){process.exit(0)}const h=JSON.parse(fs.readFileSync(p+'test-history.json','utf8'));const s=JSON.parse(fs.readFileSync(p+'selectors.json','utf8'));const runs=h.runs||[];const last=runs[runs.length-1];const selCount=Object.keys(s.elements||{}).length;const stale=Object.values(s.elements||{}).filter(e=>e.confidence<0.7).length;console.log('AI Test Engine: '+selCount+' selectors ('+stale+' low-confidence) | '+(runs.length)+' runs | Last: '+(last?last.date:'never')+' | '+(last?(last.passed+'/'+last.total+' passed'):'no runs yet'))\"",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Verify hook runs without error**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
node -e "const fs=require('fs');const p='.test-memory/';if(!fs.existsSync(p)){console.log('No .test-memory/ found');process.exit(0)}const h=JSON.parse(fs.readFileSync(p+'test-history.json','utf8'));const s=JSON.parse(fs.readFileSync(p+'selectors.json','utf8'));const runs=h.runs||[];const last=runs[runs.length-1];const selCount=Object.keys(s.elements||{}).length;console.log('AI Test Engine: '+selCount+' selectors | '+(runs.length)+' runs')"
```

Expected output: `AI Test Engine: N selectors | 0 runs` (after memory is initialized)

- [ ] **Step 3: Commit**

```bash
cd /tmp/ai-test-engine-plugin
git add hooks/
git commit -m "feat: add SessionStart hook for memory context injection"
```

---

## Task 10: Create References (Cross-Project Knowledge)

**Files:**
- Create: `ai-test-engine-plugin/references/playwright-patterns.md`

- [ ] **Step 1: Create `references/playwright-patterns.md`**

This is the plugin's built-in knowledge — applicable to ANY project, not just GBase. Distilled from our experience but generalized:

```markdown
# Playwright Best Practices for AI Test Generation

## Selector Priority (most stable → least stable)

1. `getByRole('role', { name: 'accessible name' })` — ARIA roles, most stable
2. `getByLabel('label text')` — form fields with labels
3. `getByPlaceholder('placeholder text')` — input fields
4. `getByText('text', { exact: true })` — visible text (always use exact:true)
5. `getByTestId('test-id')` — data-testid attributes
6. `locator('css selector')` — CSS selectors (avoid)
7. `evaluate()` — DOM traversal (last resort, but reliable for inaccessible elements)

## Wait Strategies (most reliable → least reliable)

1. `expect(locator).toBeVisible({ timeout: N })` — wait for element
2. `page.waitForURL(pattern)` — wait for navigation
3. `page.waitForLoadState('networkidle')` — wait for network quiet
4. `page.waitForTimeout(N)` — fixed delay (avoid except after search/filter)

## Common Gotchas

### Mantine UI
- Tab components: use `getByRole('tab', { name: 'Full Tab Text' })` — text includes full label
- Select/dropdown: use `getByRole('option')` after opening
- Dialog: use `getByRole('dialog', { name: 'dialog title' })`
- Cards with action buttons: buttons may lack accessible names → use `evaluate()` for DOM traversal

### i18n (Japanese)
- No space before particles (を、が、は): `${name}を削除` not `${name} を削除`
- Always verify exact text against i18n JSON files or DOM snapshot
- Some text may be split across elements — use `getByText` on the parent

### List Pages
- Always use search/filter before clicking items in long lists
- After filtering: `waitForTimeout(1000)` for server-side search
- Use `{ exact: true }` to avoid matching substrings (e.g., "ISMS" vs "ISMS-copy(2)")

### Test Data Management
- Name pattern: `E2E_{Module}_{Date.now()}`
- Always include cleanup in test (create → verify → delete)
- Provide a cleanup utility for orphaned test data from failed runs
```

- [ ] **Step 2: Commit**

```bash
git add references/
git commit -m "feat: add cross-project Playwright patterns reference"
```

---

## Task 11: Push Plugin Repo to GitHub

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create sparticleinc/ai-test-engine-plugin --public --description "Intelligent self-healing E2E test system — Claude Code Plugin"
```

- [ ] **Step 2: Push**

```bash
cd /tmp/ai-test-engine-plugin
git remote add origin https://github.com/sparticleinc/ai-test-engine-plugin.git
git branch -M main
git push -u origin main
```

---

## Task 12: Initialize Memory in StagingTest + Push

- [ ] **Step 1: Create `.test-memory/` with all files from Tasks 3-5**

Ensure all files exist in `/Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine/`:
- `.test-memory/selectors.json` (from Task 3)
- `.test-memory/patterns.md` (from Task 4)
- `.test-memory/product-map.json` (from Task 5)
- `.test-memory/test-history.json` (from Task 5)
- `.test-memory/changelog.md` (from Task 5)
- `.test-config.json` (from Task 5)

- [ ] **Step 2: Add `.test-memory/.pending-scan` to `.gitignore`**

Append to existing `.gitignore`:
```
.test-memory/.pending-scan
```

- [ ] **Step 3: Commit and push to StagingTest**

```bash
git add .test-memory/ .test-config.json .gitignore
git commit -m "feat: initialize AI Test Engine memory (Phase 0)"
git push origin main
```

---

## Task 13: Verification Gate

**Prerequisites**: Playwright installed (`npx playwright --version`), `.env` file with credentials exists, staging server is accessible. These are already in place from the existing test setup.

- [ ] **Step 1: Verify plugin repo structure**

```bash
cd /tmp/ai-test-engine-plugin
find . -not -path './.git/*' -type f | sort
```

Expected:
```
./.claude-plugin/plugin.json
./.gitignore
./README.md
./commands/test-init.md
./commands/test-run.md
./commands/test-status.md
./hooks/hooks.json
./memory/patterns.template.md
./memory/product-map.template.json
./memory/selectors.template.json
./memory/test-history.template.json
./references/playwright-patterns.md
./skills/run-tests/SKILL.md
```

- [ ] **Step 2: Verify project memory structure**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
ls -la .test-memory/
cat .test-memory/selectors.json | python3 -m json.tool > /dev/null && echo "selectors.json: valid"
cat .test-memory/product-map.json | python3 -m json.tool > /dev/null && echo "product-map.json: valid"
cat .test-memory/test-history.json | python3 -m json.tool > /dev/null && echo "test-history.json: valid"
```

- [ ] **Step 3: Verify tests still pass**

```bash
cd /Users/lirh2025/Desktop/SalesRoom2/apps/ai-test-engine
npx playwright test --reporter=line
```

Expected: 33 passed

- [ ] **Step 4: Final commit with spec + plan docs**

```bash
git add docs/
git commit -m "docs: add Phase 0 spec and implementation plan"
git push origin main
```
