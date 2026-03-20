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
