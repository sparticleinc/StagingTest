# GBase Admin E2E Test Matrix

> Auto-generated from codebase analysis of `mygpt-frontend` (prod_1014) + `felo-mygpt` (staging)
> Target: https://admin-staging.gbase.ai

## Tag System

| Tag | Meaning | Run Command |
|-----|---------|-------------|
| `@L1` | Level 1: Page reachability & display | `--grep @L1` |
| `@L2` | Level 2: Basic CRUD operations | `--grep @L2` |
| `@L3` | Level 3: Form interactions & validation | `--grep @L3` |
| `@L4` | Level 4: Business workflows (multi-step) | `--grep @L4` |
| `@L5` | Level 5: Edge cases & error handling | `--grep @L5` |
| `@P0` | Critical path — must pass | `--grep @P0` |
| `@P1` | Important — should pass | `--grep @P1` |
| `@P2` | Nice to have | `--grep @P2` |
| `@smoke` | Quick smoke test (< 2 min total) | `--grep @smoke` |

## Test Files & Cases

### auth.spec.ts — Authentication
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 1 | ログイン成功 | @L1 @P0 @smoke | - |
| 2 | ログイン失敗（不正パスワード） | @L5 @P1 | - |
| 3 | 未ログインでリダイレクト | @L1 @P1 | - |

### navigation.spec.ts — Page Navigation
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 4 | 全メインページ正常表示 | @L1 @P0 @smoke | auth |
| 5 | ワークスペース切替 | @L2 @P1 | auth |
| 6 | ボット内サブページ表示 | @L1 @P0 | auth |

### bot-management.spec.ts — Bot List & Search
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 7 | ボット一覧表示 | @L1 @P0 @smoke | auth |
| 8 | ボット検索 | @L2 @P1 | auth |
| 9 | ボット詳細ページ遷移 | @L1 @P0 | auth |
| 10 | ボット作成ボタン表示 | @L1 @P1 | auth |

### bot-crud.spec.ts — Bot Create/Delete
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 11 | ボット作成→削除 | @L2 @P0 | auth |

### bot-settings.spec.ts — Bot Settings ★NEW
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 12 | 設定ページ各タブ表示 | @L1 @P0 | auth, bot |
| 13 | ボット名編集 | @L3 @P1 | auth, bot |
| 14 | プロンプト設定変更 | @L3 @P1 | auth, bot |
| 15 | 詳細設定トグル | @L3 @P2 | auth, bot |
| 16 | 危険ゾーン表示 | @L1 @P1 | auth, bot |

### chat.spec.ts — Chat Functionality
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 17 | チャット送信 & AI応答受信 | @L4 @P0 | auth, bot |
| 18 | チャットページUI要素 | @L1 @P1 | auth, bot |

### knowledge-base.spec.ts — Knowledge Base
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 19 | ナレッジベース一覧表示 | @L1 @P0 @smoke | auth |
| 20 | ナレッジベース検索 | @L2 @P1 | auth |

### dataset-management.spec.ts — Dataset CRUD ★NEW
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 21 | データセット一覧表示 | @L1 @P0 | auth |
| 22 | データセット詳細ページ遷移 | @L1 @P1 | auth |
| 23 | データソースタブ表示 | @L1 @P1 | auth, dataset |

### api-keys.spec.ts — API Key Management ★NEW
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 24 | APIキーページ表示 | @L1 @P1 | auth |
| 25 | APIキー作成→削除 | @L2 @P0 | auth |
| 26 | APIキー説明編集 | @L3 @P2 | auth |

### dictionary.spec.ts — Dictionary/Glossary ★NEW
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 27 | 用語集ページ表示 | @L1 @P1 | auth, bot |
| 28 | 用語追加→削除 | @L2 @P1 | auth, bot |

### bot-workflow.spec.ts — End-to-End Workflows ★NEW
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 29 | ボット作成→設定→チャット→削除 | @L4 @P0 | auth |
| 30 | ボット作成→データセット追加→質問→削除 | @L4 @P1 | auth |

### access-control.spec.ts — Access & Sharing ★NEW
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 31 | アクセス管理ページ表示 | @L1 @P2 | auth |
| 32 | コラボレーティブスペース表示 | @L1 @P2 | auth |

### validation.spec.ts — Form Validation & Errors ★NEW
| # | Test Name | Tags | Depends On |
|---|-----------|------|------------|
| 33 | ボット作成：名前空欄エラー | @L5 @P1 | auth |
| 34 | ボット作成：説明空欄エラー | @L5 @P1 | auth |
| 35 | ボット作成：名前100文字制限 | @L5 @P2 | auth |
| 36 | 存在しないページで404表示 | @L5 @P1 | auth |

## Dependency Graph

```
auth (login)
├── navigation (sidebar, pages)
├── bot-management (list, search)
│   └── bot-crud (create, delete)
│       └── bot-settings (tabs, edit)
│           └── chat (send, receive)
│           └── dictionary (add, delete)
├── knowledge-base (list, search)
│   └── dataset-management (detail, sources)
├── api-keys (create, delete, edit)
├── access-control (view)
├── validation (error cases)
└── bot-workflow (full scenarios)
```

## Running Tests

```bash
# All tests
npx playwright test

# By level (easy → hard)
npx playwright test --grep @L1    # 13 tests — page display
npx playwright test --grep @L2    # 8 tests — basic CRUD
npx playwright test --grep @L3    # 4 tests — form interactions
npx playwright test --grep @L4    # 3 tests — business workflows
npx playwright test --grep @L5    # 5 tests — edge cases

# By priority
npx playwright test --grep @P0    # Critical path
npx playwright test --grep @smoke # Quick validation

# By module
npx playwright test tests/auth.spec.ts
npx playwright test tests/bot-crud.spec.ts
```
