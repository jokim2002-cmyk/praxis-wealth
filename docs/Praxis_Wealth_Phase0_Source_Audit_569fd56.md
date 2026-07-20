# Praxis Wealth â€” Phase 0 Source Audit and Freeze Plan

**Audit target:** Laptop source archive `Praxis_Wealth_Laptop_Source_569fd56.zip`
**Expected Git checkpoint:** `569fd5632a1296965aa1e7f828e68ebbf601cd71`
**Protected rollback tag:** `praxis-v1.0.3-stable-offline`
**Protected rollback commit:** `bd92445cd7b2f8f613604ba3e1fe37cfb004179e`
**Archive SHA-256:** `7c3521625a71a13649d3bfb51e2c5c7e7b234a9a9b4689c86d67203341520b52`
**Archive integrity:** PASS â€” ZIP test completed without errors
**Files audited:** 57

## 1. Executive conclusion

The uploaded source is a small Expo Router / React Native v1.0.3 application whose active runtime is deliberately hard-locked to local-only operation. The old Emergent preview backend is absent from active runtime configuration and `src/utils/api.ts`. The current ledger is functional but is not yet the roadmap's hybrid financial-memory architecture: all finance data is stored as one JSON object in AsyncStorage, with no schema version, migration ledger, relational integrity, account/debt model, monthly snapshots, backup import/export, or sync queue.

The source is suitable as the protected v1.0.3 baseline and as the migration input for Phase 1. It is not suitable for beginning Phase 1 until the remaining Phase 0 cleanup, compiled-bundle scan, and real-device persistence acceptance are completed and recorded.

## 2. Verified project identity

| Item | Verified value |
|---|---|
| Package name | `praxis-wealth` |
| App version | `1.0.3` |
| Android versionCode | `3` |
| Android package | `com.emergent.aiwealthmanager.oaa4sb` |
| Expo owner | `jokim22` |
| Expo project ID | `01b9c17d-d04c-4d0d-98cc-a1bde7450c82` |
| Expo SDK | `54.0.36` |
| React Native | `0.81.5` |
| React | `19.1.0` |
| TypeScript | `5.9.3` |
| Router | Expo Router `6.0.24` with typed routes |
| New Architecture | Enabled |
| EAS preview | Internal APK |

## 3. Current screens and navigation

The app uses Expo Router with a root stack and five bottom tabs.

### Root routes

1. `app/index.tsx` â€” reads onboarding flag and redirects.
2. `app/onboarding.tsx` â€” four-step local setup.
3. `app/(tabs)` â€” main app shell.

### Tabs

1. **Ledger** â€” `dashboard.tsx`
   - net worth;
   - safe-to-spend;
   - current-month spend;
   - health score;
   - local deterministic â€œAsk CAâ€ insight;
   - liquidity values;
   - category spend.
2. **Entries** â€” `expenses.tsx`
   - add expense or income;
   - local keyword categorisation;
   - category filtering;
   - transaction deletion with confirmation.
3. **Plan** â€” `plan.tsx`
   - goals;
   - recurring bills;
   - emergency-fund planning;
   - contributions and deletion.
4. **Tax** â€” `tax.tsx`
   - simplified old/new regime comparison;
   - 80C usage;
   - advance-tax date/amount;
   - capital-gains placeholders.
5. **CA** â€” `ca.tsx`
   - stored local chat history;
   - keyword-based deterministic replies;
   - no online AI backend.

## 4. Current persistence model

### Main finance store

`src/utils/api.ts` stores one JSON document under:

```text
praxis_local_store_v2
```

Current shape:

```text
LocalStore
â”œâ”€â”€ profile
â”œâ”€â”€ budgets
â”œâ”€â”€ transactions[]
â”œâ”€â”€ goals[]
â”œâ”€â”€ bills[]
â””â”€â”€ chats{sessionId: messages[]}
```

### Separate onboarding flag

`src/utils/onboarding.ts` stores:

```text
praxis_onboarded_v1 = "1"
```

This duplicates onboarding state because `profile.onboarded` also exists in the main store.

### Existing generic storage wrapper

`src/utils/storage/` contains AsyncStorage and SecureStore wrappers, but the active finance API bypasses this wrapper and uses AsyncStorage directly. SecureStore is therefore available but is not currently protecting finance data or an authentication session.

### Persistence risks

1. No explicit schema version.
2. No migration journal or migration rollback.
3. No atomic multi-record transaction support.
4. No account/debt/balance-ledger entities.
5. No monthly snapshots.
6. No backup import/export.
7. No sync queue or tombstones.
8. If JSON parsing fails, `readStore()` overwrites the stored value with a fresh empty seed. This can silently destroy recoverable user data.
9. The whole financial history is rewritten on every change.
10. Onboarding state is duplicated across two keys and could become inconsistent.

## 5. Current domain schema

### Profile

```text
id
name
monthly_income
income_type
cash_on_hand
bank_balance
emergency_fund
onboarded
```

### Transaction

```text
id
amount
description
category
type: expense | income
date
ai_categorized?
notes?
```

### Goal

```text
id
name
target
saved
kind
target_date?
icon?
created_at
```

### Bill

```text
id
name
amount
kind
day_of_month
paid_months[]
active
days_until_due?
paid_this_month?
```

### Missing Phase 1 entities/fields

- schema metadata and migration history;
- accounts and account types;
- opening/current balances with reconciled ledger movements;
- transaction update/edit state;
- recurring transaction rules;
- EMI/debt principal, rate, installment and due schedule;
- structured categories;
- budget cycles;
- monthly snapshots;
- backup metadata;
- sync metadata;
- deletion tombstones.

## 6. Active API layer

`src/utils/api.ts` is a 362-line combined persistence, domain, calculation and mock-service module.

### Offline lock

```text
API = local://praxis-offline
LOCAL_ONLY = true
remote() always throws
withFallback() always executes localCall()
```

### Available local operations

- categories;
- get/update profile;
- get/update budgets;
- list/create/delete transactions;
- dashboard;
- local insights;
- local keyword chat and history;
- tax summary/comparison;
- list/create/contribute/delete goals;
- list/create/toggle/delete bills;
- emergency-fund plan.

### Architecture risk

Storage, schema repair, financial calculations, tax logic, AI simulation and service methods are tightly coupled in one module. Phase 1 must preserve behavior through a repository/service boundary rather than allowing screens to access SQLite directly.

## 7. Calculation audit

### Current safe-to-spend

```text
monthly income + income entries âˆ’ current-month expenses
```

The result is clamped to zero.

This is not the PRD formula because it does not reserve:

- fixed bills;
- EMI/debt;
- savings target;
- emergency reserve;
- upcoming bills.

### Current net worth

```text
cash_on_hand + bank_balance + emergency_fund
```

It does not include multiple accounts, assets or debts.

### Current emergency-fund logic is inconsistent

- Dashboard target: six times current-month spending, or six times profile income when spending is zero.
- Plan target: six times the sum of selected default category budgets.

The same user can therefore see two different emergency-fund targets.

### Bill paid-toggle defect

Marking a bill paid creates an expense transaction. Marking it unpaid removes only the month from `paid_months`; it does not remove the generated expense. Marking it paid again creates another expense. This can produce duplicate ledger expenses.

### Tax logic limitations

- annual income uses only `monthly_income Ã— 12`;
- income transaction entries are ignored;
- slabs/rebates are hardcoded and have no fiscal-year configuration;
- UI explicitly labels the logic FY 2024-25;
- 80C usage treats every `investment` expense in the calendar year as eligible;
- tax output is a simplified estimate, not filing-grade computation.

## 8. UI and behavior findings

### Confirmed source defects

1. `app/onboarding.tsx` contains mojibake strings such as `Ã¢â€šÂ¹` and `OpeningÃ¢â‚¬Â¦` instead of `â‚¹` and `Openingâ€¦`.
2. CA chat uses no Android keyboard avoidance (`behavior` is undefined on Android), matching the roadmap keyboard-overlap gap.
3. `LogBox.ignoreAllLogs(true)` suppresses all React Native warnings, reducing observability.
4. Goal and bill deletion have no confirmation dialog; transaction deletion does.
5. Goal/bill/emergency actions have limited error handling.
6. The CA screen describes itself as a personal CA even though it is currently a local keyword assistant; final positioning must remain â€œAI CA Assistant,â€ not a licensed CA.
7. The README remains default Expo boilerplate and does not document Praxis setup, architecture, rollback or validation.

### Positive findings

- Extensive `testID` hooks already exist for onboarding, transactions, dashboard, plans, tax and chat.
- Screens use typed API return models.
- Offline operations do not depend on network state.
- Transaction deletion includes user confirmation.
- The source uses strict TypeScript configuration.

## 9. Test and validation inventory

### Present

- `scripts/validate-build.cjs`
- `npm run check:build`
- Expo Doctor
- many UI `testID` hooks

### Absent

- no unit test files;
- no integration test files;
- no migration tests;
- no persistence fixture tests;
- no test script in `package.json`;
- no automated calculation fixtures;
- no real-device acceptance record inside the repo.

The current build validator checks identity and offline-lock markers. It does not test actual ledger behavior, persistence, calculations or the compiled Android bundle.

## 10. Repository/configuration risks

1. Three `*.before-404-fix...bak` files are committed in the active source archive.
2. The old Emergent URL and backend environment variable remain inside the historical `api.ts` backup file. They are not imported by active code, but they create future confusion and accidental-reconnection risk.
3. The stable Git tag now preserves the old source, so these loose backup files do not need to remain on master.
4. `.gitignore` ignores only `.env*.local`, not every possible `.env` file.
5. No Android keyboard layout mode is configured in `app.json`.
6. No dependency or runtime engine policy is declared for Node/npm.
7. Node 24 was installed on the laptop; project compatibility should be recorded and monitored even though current validation passed.

## 11. Phase 0 gate status

| Gate | Status | Evidence |
|---|---|---|
| Protected rollback commit/tag | PASS | Git output supplied by user |
| GitHub master checkpoint | PASS | `569fd563...` |
| Fresh laptop clone/restore | PASS | clean clone from private GitHub repo |
| Source archive integrity | PASS | ZIP test and SHA-256 recorded |
| Source working tree | PASS | user console shows clean |
| `npm ci` | PASS | completed before subsequent commands |
| `npm run check:build` | PASS | all current validator checks passed |
| Expo Doctor | PASS | 18/18 |
| Active runtime offline lock | PASS | source audit |
| Old backend absent from active API/EAS | PASS | source audit/build validator |
| Complete source inventory | PASS | this audit |
| Compiled Android export scan | PENDING | must scan exported bundle |
| Onboarding mojibake repair | PENDING | source defect |
| Historical loose backup cleanup | PENDING | source hygiene/safety |
| Regression checklist in repo | PENDING | must document |
| Real-phone onboarding/ledger test | PENDING | user acceptance required |
| Data survives restart | PENDING | user acceptance required |
| Final Phase 0 report commit/push | PENDING | after all gates pass |

## 12. Cohesive Phase 0 completion plan

The remaining work should be done as one controlled Phase 0 bunch, without starting Phase 1.

### Source changes

1. Repair only the onboarding encoding strings (`â‚¹`, `â€¦`).
2. Remove the three loose pre-404 backup files from master after confirming the protected stable tag and external bundle remain available.
3. Add a Praxis-specific README section or replace the boilerplate README with baseline setup, architecture, validation and rollback instructions.
4. Add this source-audit report to `docs/`.
5. Add a Phase 0 regression checklist and rollback procedure to `docs/`.
6. Strengthen the Phase 0 validator to check:
   - stable version/package;
   - local-only marker;
   - storage keys;
   - route inventory;
   - no mojibake in active source;
   - no old backend in active runtime/config;
   - no loose `before-404-fix` files on master.

### Validation bunch

1. `npm ci`
2. `npm run lint`
3. `npm run check:build`
4. `npx.cmd expo-doctor`
5. full Expo config snapshot
6. Android Expo export
7. compiled bundle scan for:
   - old Emergent URL;
   - `/api/profile`;
   - `EXPO_PUBLIC_BACKEND_URL`;
   - offline marker;
   - stable storage key.
8. verify Git working tree contains only approved Phase 0 changes.

### Real-phone acceptance

Using the existing v1.0.3 APK or one final validated APK:

1. app opens;
2. onboarding displays correct rupee characters;
3. onboarding completes;
4. add one expense and one income;
5. create one goal and one bill;
6. mark bill paid once and verify the current known duplicate-risk behavior is documented or repaired only if accepted as a Phase 0 regression defect;
7. force-close/reopen;
8. verify profile, entries, goal and bill remain;
9. verify no `/api/profile` 404;
10. verify offline operation.

### Final checkpoint

After all gates pass:

1. create one Phase 0 completion commit on master;
2. push master;
3. do not move `praxis-v1.0.3-stable-offline`;
4. record final master commit, audit artifacts and phone acceptance;
5. mark Phase 0 PASS;
6. only then begin Phase 1.

## 13. Files expected to change in remaining Phase 0

```text
app/onboarding.tsx
README.md
scripts/validate-build.cjs (or new scripts/validate-phase0.cjs)
docs/Praxis_Wealth_Phase0_Source_Audit.md
docs/Praxis_Wealth_Phase0_Regression_Checklist.md
docs/Praxis_Wealth_Phase0_Rollback_Procedure.md
```

Files expected to be removed from master while remaining preserved in Git history/tag and external backups:

```text
app.json.before-404-fix.20260719-201617.bak
package.json.before-404-fix.20260719-201617.bak
src/utils/api.ts.before-404-fix.20260719-201617.bak
```

No Phase 1 database, cloud, AI, language, voice or redesign work belongs in this bunch.
