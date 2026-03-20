# AI Test Engine Plugin — System Design Spec

**Date**: 2026-03-20
**Status**: Approved
**Author**: Claude + User collaborative design

---

## 1. Overview

A Claude Code Plugin that provides an intelligent, self-healing E2E test system with persistent memory. The plugin understands the product under test, generates Playwright tests, automatically repairs broken tests, and continuously improves through accumulated experience.

### Core Principles

- **Event-driven + Shared Memory**: Agents operate independently, coordinating through a shared memory layer
- **Three-layer memory**: Selector-level → Pattern-level → Product-level knowledge
- **Self-healing**: Automatically diagnoses and fixes selector/timeout/visibility failures
- **Growth-oriented**: Every debug session enriches the memory, making future tests more reliable

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Event-driven + shared memory | Loose coupling, matches SalesRoom patterns |
| Tech stack | Claude Code Skills + Hooks | Zero infrastructure, user already familiar |
| Distribution | Independent Plugin (own Git repo) | Portable, grows with Claude Code ecosystem |
| Repo strategy | Plugin repo + Project repo | Logic is reusable, test data is project-specific |
| Memory format | JSON (structured) + MD (knowledge) | JSON for programmatic access, MD for human+AI readability |

---

## 2. Repository Structure

### Plugin Repository (`sparticleinc/ai-test-engine-plugin`)

```
ai-test-engine-plugin/
├── plugin.json                     # Claude Code plugin manifest (see §2.1)
│
├── agents/                         # 4 core Agents (decision makers)
│   ├── product-expert.md           # Understands codebase → outputs product knowledge
│   ├── test-generator.md           # From knowledge → generates/updates tests
│   ├── test-healer.md              # Analyzes failures → fixes tests
│   └── test-reviewer.md            # Reviews coverage + suggests improvements
│
├── skills/                         # Concrete capabilities (executors)
│   ├── analyze-codebase/
│   │   └── SKILL.md                # Scan React components, routes, i18n
│   ├── generate-tests/
│   │   └── SKILL.md                # Generate Playwright .spec.ts from product-map
│   ├── run-tests/
│   │   └── SKILL.md                # Execute tests + collect results
│   ├── diagnose-failure/
│   │   └── SKILL.md                # Parse error + screenshot + snapshot → classify
│   ├── heal-selector/
│   │   └── SKILL.md                # Find new selector from DOM snapshot
│   ├── sync-i18n/
│   │   └── SKILL.md                # Sync UI text changes from i18n files
│   └── coverage-report/
│       └── SKILL.md                # Generate coverage gap report
│
├── hooks/
│   ├── hooks.json                  # Hook configuration
│   ├── on-test-fail.mjs            # Test failure → trigger diagnose + heal
│   ├── on-code-change.mjs          # Frontend code change → set flag file for next session
│   └── on-session-start.mjs        # Session start → load memory context + check pending flags
│
├── commands/
│   ├── test-init.md                # /test-init — initialize .test-memory/ in current project
│   ├── test-run.md                 # /test-run — execute tests
│   ├── test-heal.md                # /test-heal — fix failing tests
│   ├── test-gen.md                 # /test-gen — generate tests from code
│   ├── test-review.md              # /test-review — review test quality
│   └── test-status.md              # /test-status — system health dashboard
│
├── memory/                         # Templates (copied to project on /test-init)
│   ├── selectors.template.json
│   ├── patterns.template.md
│   ├── product-map.template.json
│   └── test-history.template.json
│
└── references/                     # Static knowledge (cross-project)
    ├── playwright-patterns.md      # Battle-tested Playwright best practices
    └── ui-framework-guides/
        └── mantine-v7.md           # Mantine UI selector strategies
```

### 2.1 plugin.json Schema

```json
{
  "name": "ai-test-engine",
  "version": "0.1.0",
  "description": "Intelligent self-healing E2E test system with persistent memory",
  "agents": [
    { "name": "product-expert", "path": "agents/product-expert.md" },
    { "name": "test-generator", "path": "agents/test-generator.md" },
    { "name": "test-healer", "path": "agents/test-healer.md" },
    { "name": "test-reviewer", "path": "agents/test-reviewer.md" }
  ],
  "skills": [
    { "name": "analyze-codebase", "path": "skills/analyze-codebase/SKILL.md" },
    { "name": "generate-tests", "path": "skills/generate-tests/SKILL.md" },
    { "name": "run-tests", "path": "skills/run-tests/SKILL.md" },
    { "name": "diagnose-failure", "path": "skills/diagnose-failure/SKILL.md" },
    { "name": "heal-selector", "path": "skills/heal-selector/SKILL.md" },
    { "name": "sync-i18n", "path": "skills/sync-i18n/SKILL.md" },
    { "name": "coverage-report", "path": "skills/coverage-report/SKILL.md" }
  ],
  "commands": [
    { "name": "test-init", "path": "commands/test-init.md" },
    { "name": "test-run", "path": "commands/test-run.md" },
    { "name": "test-heal", "path": "commands/test-heal.md" },
    { "name": "test-gen", "path": "commands/test-gen.md" },
    { "name": "test-review", "path": "commands/test-review.md" },
    { "name": "test-status", "path": "commands/test-status.md" }
  ],
  "hooks": {
    "path": "hooks/hooks.json"
  }
}
```

### Project Repository (e.g., `sparticleinc/StagingTest`)

```
StagingTest/
├── tests/                          # Playwright test files
│   ├── helpers/
│   │   └── auth.ts
│   ├── *.spec.ts                   # Test files (33 existing)
│   └── cleanup-e2e-bots.spec.ts
├── .test-memory/                   # Project-specific memory (read/written by plugin)
│   ├── selectors.json              # L1: Element → best selector strategy
│   ├── patterns.md                 # L2: Framework patterns + anti-patterns
│   ├── product-map.json            # L3: Page structure, routes, components
│   ├── test-history.json           # Execution history + flaky detection
│   └── changelog.md                # Memory change log
├── .test-config.json               # Project-specific plugin config (see §2.2)
├── playwright.config.ts
├── package.json
└── .env
```

### 2.2 Project Config (`.test-config.json`)

Created by `/test-init`. Tells the plugin where to find the codebase and how to run tests.

```json
{
  "frontendPath": "../mygpt-frontend",
  "frontendBranch": "prod_1014",
  "backendPath": "../felo-mygpt",
  "backendBranch": "staging",
  "testCommand": "npx playwright test",
  "baseUrl": "https://admin-staging.gbase.ai",
  "i18nPath": "src/locales/ja/translation.json",
  "routerConfigPath": "src/routes.tsx"
}
```

---

## 3. Agent Specifications

### Agent 1: Product Expert

**Purpose**: Understand the product codebase and maintain a structured knowledge map.

**Triggers**:
- `/test-init` (first-time, no product-map exists)
- Frontend code changes detected (via `on-code-change` flag)
- User invokes `/test-gen`

**Input**: Frontend codebase path (from `.test-config.json`)

**Output**: `product-map.json` — structured product knowledge

**Capabilities**:
- Scan React Router config → extract all routes and page components
- Parse i18n JSON (full scan) → map translation keys to UI text for all pages
- Analyze component props/state → identify interactive elements (forms, buttons, dialogs)
- Detect UI framework (Mantine, MUI, etc.) → load framework-specific selector guide from `references/`
- Diff against existing map → only update changed sections

**product-map.json schema**:
```json
{
  "version": "1.0",
  "lastUpdated": "2026-03-20T00:00:00Z",
  "app": "string — app name",
  "baseUrl": "string — staging URL",
  "framework": {
    "ui": "string — UI library + version",
    "router": "string — router library",
    "i18n": "string — i18n library",
    "state": "string — state management"
  },
  "pages": [
    {
      "id": "string — unique page ID (kebab-case, e.g. 'bot-list', 'bot-settings')",
      "path": "string — route path",
      "title": "string — page title (from i18n)",
      "components": ["string[] — key component names"],
      "keySelectors": {
        "elementName": {
          "strategy": "string — Playwright selector",
          "confidence": "number 0-1",
          "i18nKey": "string — translation key if applicable"
        }
      },
      "i18nKeys": ["string[] — all i18n keys used on this page"],
      "testCoverage": "none | partial | full"
    }
  ],
  "flows": [
    {
      "id": "string — flow ID",
      "name": "string — human readable name",
      "steps": ["string[] — page transitions"],
      "priority": "P0 | P1 | P2",
      "testCoverage": "none | partial | full"
    }
  ]
}
```

---

### Agent 2: Test Generator

**Purpose**: Generate Playwright test files from product knowledge + learned patterns.

**Triggers**:
- `product-map.json` updated
- User invokes `/test-gen [module]`

**Input**: `product-map.json` + `patterns.md` + `selectors.json`

**Output**: New or updated `.spec.ts` files

**Generation rules**:
```
Level assignment:
  New page discovered       → generate @L1 (reachability test)
  Page has forms            → add @L3 (validation tests)
  Page has CRUD operations  → add @L2 (operation tests) + @L5 (edge cases)
  Multi-step workflow       → add @L4 (workflow test)

Selector strategy priority (from patterns.md):
  1. getByRole() + Japanese label (most stable)
  2. getByPlaceholder() (form fields)
  3. getByText({ exact: true }) (text matching)
  4. Search box filter → then click (list items)
  5. evaluate() DOM traversal (last resort)

Test structure:
  - Import login helper
  - Use beforeEach for auth
  - Timestamp-based test data names (E2E_{module}_{Date.now()})
  - Self-cleaning (create → verify → delete)
  - Japanese test names + tag annotations (@L1-L5, @P0-P2, @smoke)
```

**Safety guardrails**:
- Never overwrite existing tests (generate as `.spec.new.ts`, user confirms merge)
- Always include cleanup logic for created test data
- Flag when generated test confidence < 0.7 (needs human review)

---

### Agent 3: Test Healer

**Purpose**: Automatically diagnose and fix test failures.

**Triggers**:
- Test failure detected (via `on-test-fail` hook)
- User invokes `/test-heal`

**Input**: Failure report (error message + screenshot + trace + DOM snapshot)

**Output**: Fixed test file + memory updates + verification re-run

**Diagnosis flow**:
```
Failure → Classify cause
  ├─ SELECTOR_BROKEN (element not found / selector changed)
  │   → Read screenshot + DOM snapshot
  │   → Find element by visual/text similarity
  │   → Generate new selector
  │   → Update selectors.json (old → alternatives, new → primary)
  │   → Update patterns.md if new pattern discovered
  │
  ├─ TIMEOUT (element exists but too slow)
  │   → Check if networkidle is needed
  │   → Increase timeout or add waitForLoadState
  │   → Note in patterns.md
  │
  ├─ NOT_VISIBLE (element exists but off-screen)
  │   → Add scrollIntoViewIfNeeded()
  │   → Or add search-before-click pattern
  │   → Update selectors.json with note
  │
  ├─ TEXT_CHANGED (expected text doesn't match)
  │   → Diff against i18n files
  │   → Update selector and test assertion
  │   → Update selectors.json
  │
  ├─ NOT_EDITABLE (trying to fill readonly field)
  │   → Find alternative input (by placeholder, label, or index)
  │   → Update selectors.json with failHistory
  │
  └─ BUSINESS_LOGIC_CHANGED (flow/behavior changed)
      → DO NOT auto-fix
      → Flag for human review
      → Add to test-history.json as "needs-review"
```

**Verification**: After fixing, Healer invokes `run-tests` skill on the specific failing test to verify the fix. Only writes memory updates if the re-run passes.

**Retry policy**: Max 3 heal-then-verify cycles per failure. If still failing after 3, escalate to human.

**Memory writeback** (only after verified fix):
1. `selectors.json` — new selector + failHistory entry
2. `patterns.md` — new pattern if novel fix discovered
3. `test-history.json` — failure + resolution record
4. `changelog.md` — one-line entry describing what was healed and why

---

### Agent 4: Test Reviewer

**Purpose**: Proactively identify quality issues and improvement opportunities.

**Triggers**:
- User invokes `/test-review`
- Periodic (suggested weekly)

**Input**: All test files + `test-history.json` + `product-map.json` + `patterns.md`

**Output**: Review report (Markdown)

**Review dimensions**:

1. **Coverage gaps**: Pages/flows in product-map with `testCoverage: "none"` → suggest test generation
2. **Flaky detection**: Tests with >20% failure rate in last 10 runs (computed on read from `test-history.json`) → flag + suggest stabilization
3. **Pattern violations**: Tests not following patterns.md → suggest refactoring
4. **Redundancy**: Multiple tests covering identical scenarios → suggest consolidation
5. **Selector health**: Elements in selectors.json with `confidence < 0.7` → flag as high-risk
6. **Stale tests**: Tests for pages no longer in product-map → flag for removal
7. **Stale selectors**: Elements with `lastVerified` > 30 days → suggest re-validation; > 90 days → suggest removal
8. **Improvement suggestions**: Based on accumulated patterns, suggest system-level improvements

**changelog.md ownership**: Test Reviewer appends a summary entry after each review. Test Healer appends after each successful heal. Format: `- YYYY-MM-DD: {agent}: {action summary}`

**Report format**:
```markdown
# Test Review Report — 2026-03-20

## Health Score: 87/100

## Coverage: 28/36 pages covered (78%)
- Missing: [page-list]

## Flaky Tests (3):
- bot-settings > 危険ゾーン表示 — failed 2/10 runs, cause: networkidle timeout

## Pattern Violations (1):
- dataset-management.spec.ts:27 — using getByText without { exact: true }

## Recommendations:
1. Add search-before-click to dictionary.spec.ts (list may grow)
2. Replace waitForTimeout(2000) in bot-workflow with waitForURL
```

---

## 4. Three-Layer Memory System

### Layer 1: Selector Memory (`selectors.json`)

Per-element "best strategy" learned from real test runs.

**Key format**: `{page-id}.{element-name}` where `page-id` matches the `id` field in `product-map.json`. During Phase 0 (before product-map exists), use manual page IDs derived from the test file name (e.g., `bot-list`, `bot-settings`). These are reconciled with product-map IDs when Phase 1 generates the map.

```json
{
  "version": "1.0",
  "lastUpdated": "2026-03-20",
  "elements": {
    "{page-id}.{element-name}": {
      "selector": "string — current best Playwright selector",
      "alternatives": ["string[] — fallback selectors"],
      "failHistory": [
        {
          "date": "ISO date",
          "oldSelector": "string",
          "reason": "string — why it broke"
        }
      ],
      "confidence": "number 0.0-1.0",
      "lastVerified": "ISO date",
      "note": "string — optional human-readable context"
    }
  }
}
```

**Update rules**:
- Test passes → `confidence` += 0.01 (cap 0.99), `lastVerified` updated
- Test fails (selector cause) → Healer fixes and verifies, writes `failHistory`, old → `alternatives`
- `confidence` < 0.7 → Reviewer flags as high-risk
- `lastVerified` > 30 days → Reviewer suggests re-validation run
- `lastVerified` > 90 days → Reviewer suggests removal (element may no longer exist)

### Layer 2: Pattern Memory (`patterns.md`)

Reusable knowledge extracted from debugging sessions.

**Boundary with Product Expert / sync-i18n**:
- Product Expert does full i18n scans (builds the complete product-map)
- `sync-i18n` skill handles incremental updates (single key changed → update affected selectors)
- patterns.md records the general lesson ("always use getByRole with full tab text for Mantine"), not per-element details (those go in selectors.json)

Structure:
```markdown
# Verified Patterns
## {pattern-name}
- **Scenario**: when to use
- **Approach**: what to do (with code example)
- **Anti-pattern**: what NOT to do
- **Learned from**: which debug session discovered this
- **Applies to**: scope (specific framework, or universal)

# Known Anti-Patterns
## {anti-pattern-name}
- **Problem**: what goes wrong
- **Alternative**: what to do instead
- **Example**: concrete code comparison
```

**Update rules**:
- Healer discovers novel fix → auto-append new pattern
- Reviewer finds pattern violation → link to existing pattern
- User manual fix detected by hook → prompt "record as new pattern?"

### Layer 3: Product Map (`product-map.json`)

Structured product knowledge (schema defined in Agent 1 spec above, includes `lastUpdated` timestamp).

**Update rules**:
- Product Expert scan → diff with existing → update only changed sections, bump `lastUpdated`
- New page added → `testCoverage: "none"` → Reviewer reports gap
- Page removed → corresponding tests flagged `deprecated` (not auto-deleted)

### Test History (`test-history.json`)

**Test ID format**: `{spec-filename}:{test-title}` — e.g., `bot-crud.spec.ts:ボット作成→削除 @L2 @P0`. Derived from Playwright's test title, stable across runs.

**Retention policy**: Keep the last 30 runs in `runs[]`. Older runs are summarized into a `summary` object (total runs, overall pass rate, per-test pass rate) and individual entries are pruned. `healHistory` is append-only but capped at 100 entries (oldest pruned).

```json
{
  "runs": [
    {
      "id": "run-{timestamp}",
      "date": "ISO date",
      "trigger": "manual | hook | ci",
      "duration": "seconds",
      "total": 33,
      "passed": 33,
      "failed": 0,
      "flaky": 0,
      "healed": 0,
      "results": {
        "test-id": { "status": "passed | failed | healed", "duration": "ms", "error": "string | null" }
      }
    }
  ],
  "summary": {
    "totalRuns": 150,
    "overallPassRate": 0.97,
    "perTest": {
      "test-id": { "passRate": 0.95, "lastRun": "ISO date" }
    }
  },
  "healHistory": [
    {
      "date": "ISO date",
      "testId": "string",
      "cause": "SELECTOR_BROKEN | TIMEOUT | NOT_VISIBLE | TEXT_CHANGED | NOT_EDITABLE",
      "fix": "string — what was changed",
      "success": true
    }
  ]
}
```

**Flaky detection**: Computed on read by Test Reviewer. A test is "flaky" if it has >20% failure rate across the last 10 runs in `runs[]`. Not stored as a separate field — always derived from current data.

---

## 5. Commands (User Interface)

| Command | Description | Triggers |
|---------|-------------|----------|
| `/test-init` | Initialize `.test-memory/` + `.test-config.json` in current project | Copy templates, prompt for config |
| `/test-run` | Run tests (all, by tag, by file) | run-tests skill |
| `/test-run @smoke` | Run smoke tests only | run-tests skill with filter |
| `/test-gen` | Generate tests for uncovered pages | Product Expert → Test Generator |
| `/test-gen bot-settings` | Generate tests for specific module | Product Expert (scoped) → Test Generator |
| `/test-heal` | Diagnose and fix failing tests | Test Healer agent |
| `/test-review` | Full quality review | Test Reviewer agent |
| `/test-status` | Show system health (pass rate, coverage, memory stats) | Read memory files |

---

## 6. Hooks (Automatic Triggers)

### `on-session-start`
- **Event**: SessionStart (startup, resume)
- **Action**: Load `.test-memory/` summary into context; check for pending `on-code-change` flags
- **Output**: Inject current test health status + recent failures + any pending code change notifications

### `on-test-fail`
- **Event**: Bash tool returns test failure output
- **Pattern**: Match commands containing `playwright test` (covers `npx playwright test`, `yarn playwright test`, npm scripts) with non-zero exit code
- **Action**: Trigger `diagnose-failure` skill → if auto-fixable, trigger `heal-selector` → `run-tests` to verify
- **Guard**: Only trigger if `.test-memory/` exists (plugin is initialized via `/test-init`)

### `on-code-change`
- **Event**: Edit/Write tool on files matching frontend patterns (`*.tsx`, `*.ts` in src/)
- **Pattern**: Component files, route files, i18n files
- **Action**: Write a flag file (`.test-memory/.pending-scan`) with changed file paths. The actual product-map refresh happens on next `/test-gen` or session start — no debounce mechanism needed since we defer to explicit triggers.
- **Guard**: Only trigger if `.test-memory/` exists

---

## 7. Implementation Phases

### Phase 0: Foundation (Day 1)
- Create plugin repo skeleton with `plugin.json`
- Implement `/test-init` command (create `.test-memory/`, prompt for `.test-config.json`)
- Extract initial memory from existing 33 tests (selectors.json, patterns.md)
- Implement `/test-run` command (wrapper around test command from `.test-config.json`)
- **Gate**: `/test-init` creates valid memory structure; `/test-run` executes existing 33 tests successfully

### Phase 1: Product Expert + Test Generation (Day 2-3)
- Implement `analyze-codebase` skill
- Implement Product Expert agent
- Implement `generate-tests` skill
- Implement Test Generator agent
- Implement `/test-gen` command
- Create `references/playwright-patterns.md`
- **Gate**: `/test-gen` produces runnable `.spec.new.ts` files for at least 3 uncovered pages. Tests are run with `run-tests` skill; pass rate measured as (passing tests) / (generated tests). Target: >80%. Failures due to selector issues are expected and acceptable if the test structure is correct.

### Phase 2: Self-Healing (Day 4-6)
- Implement `diagnose-failure` skill
- Implement `heal-selector` skill
- Implement `sync-i18n` skill (incremental i18n update, distinct from Product Expert's full scan)
- Implement Test Healer agent (orchestrates: diagnose → fix → re-run → memory writeback)
- Implement `on-test-fail` hook
- Implement memory writeback (selectors.json + patterns.md + changelog.md auto-update)
- **Gate**: Intentionally break a selector → Healer auto-diagnoses → fixes test file → re-runs and passes → selectors.json + patterns.md + changelog.md all updated

### Phase 3: Review + Continuous Improvement (Day 7-8)
- Implement `coverage-report` skill
- Implement Test Reviewer agent
- Implement `/test-review` and `/test-status` commands
- Implement `test-history.json` tracking (append on each `/test-run`)
- Implement `on-session-start` hook (memory context injection)
- **Gate**: `/test-review` outputs a report that correctly identifies: (a) at least 1 coverage gap vs product-map, (b) flaky test detection from history, (c) at least 1 actionable recommendation

### Phase 4: CI/CD Integration (Future)
- GitHub Actions workflow for PR-triggered tests
- PR comment bot (test results + coverage delta)
- Nightly regression cron
- Slack/Feishu failure notifications
- **Gate**: PR with frontend change → GitHub Action runs tests → posts comment with pass/fail + coverage delta → blocks merge if P0 tests fail

---

## 8. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Auto-heal changes test semantics | Healer NEVER modifies assertions, only selectors/waits. Business logic changes flagged for human review |
| Memory grows unbounded | test-history.json: 30-run retention + summary rollup. selectors.json: Reviewer prunes entries with lastVerified > 90 days. healHistory: capped at 100 entries |
| Generated tests are low quality | Generated as `.spec.new.ts` for human review before merge. Confidence scoring |
| Plugin breaks on Claude Code updates | Minimal hook surface. Skills are plain Markdown, agents are plain Markdown — no compiled code |
| False positive heals | Healer verifies fix with re-run before writing memory. Max 3 attempts, then escalate to human |

---

## 9. Success Metrics

| Metric | Phase 0 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|
| Test count | 33 (manual) | 50+ (auto-generated) | 80+ |
| Pass rate | 100% | >95% (with auto-heal) | >98% |
| Mean time to heal | N/A (manual) | <5 min (auto) | <2 min |
| Coverage (pages) | ~60% | >85% | >95% |
| Memory entries | 20 selectors | 100+ selectors, 30+ patterns | Growing |
| Human intervention | Every failure | Only business logic changes | Minimal |
