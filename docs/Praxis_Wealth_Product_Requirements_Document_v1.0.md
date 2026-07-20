# Praxis Wealth Product Requirements Document

**Version:** 1.0  
**Status:** Canonical working PRD; Phase 0 baseline freeze pending source-level completion  
**Date:** 20 July 2026  
**Product:** Praxis Wealth  
**Current stable checkpoint:** v1.0.3 Offline  
**Next roadmap target:** Phase 0 completion, then v1.1.0 Hybrid Financial Memory

---

## Document Authority and Change Control

This PRD defines **what Praxis Wealth must do**. The uploaded `Praxis_Wealth_Online_AI_Roadmap_v2.md` defines **the mandatory implementation order**. The uploaded `Praxis_Wealth_Master_Handover_Prompt.md` defines **working rules and safety constraints**.

When documents conflict:

1. The roadmap phase order and non-negotiable safety rules prevail.
2. The current verified v1.0.3 rollback checkpoint must be preserved.
3. A later feature may move earlier only for a documented technical dependency.
4. No requirement in this PRD authorizes work outside the roadmap.
5. PRD changes require a version update, rationale, and roadmap-impact note.

---

## 1. Executive Summary

Praxis Wealth is a **local-first personal finance application** that will combine a dependable on-device financial ledger, secure cloud synchronization, deterministic financial calculations, and an online multilingual AI CA Assistant.

The product must remain useful without internet. Income, expenses, balances, budgets, goals, bills, debt and stored reports must continue to work locally. When internet is available, the app will securely synchronize data and provide AI-guided explanations in English, Hindi, Gujarati, Hinglish and Gujlish. AI must never invent financial numbers and must never directly change money records without explicit user confirmation.

The uploaded v1.0.3 APK is accepted as the current binary rollback baseline. It proves the old Emergent preview backend dependency has been removed from the compiled build. The complete source ZIP is still required before Phase 0 can be declared complete.

---

## 2. Canonical Product Statement

> Praxis Wealth is a local-first personal finance app with secure cloud synchronization and an online multilingual AI CA Assistant. It remembers the user's financial history, calculates exact spending and savings guidance, supports English, Hindi and Gujarati text/voice interaction, and remains a usable ledger when internet or AI services are unavailable.

---

## 3. Product Problem

Personal finance users often track money in fragmented notes, spreadsheets, banking apps and memory. These tools may show transactions but do not reliably answer practical questions such as:

- How much can I safely spend for the rest of this month?
- Which category increased compared with last month?
- Are upcoming bills likely to create a cash shortage?
- Am I still on track for my savings goal?
- Can I ask these questions naturally in Hindi, Gujarati or mixed language?
- Can the app continue working when the internet or AI service is unavailable?

Praxis Wealth must solve these problems without turning financial arithmetic over to a generative model and without making the local ledger dependent on a remote backend.

---

## 4. Target Users

### Primary user

An Indian individual or household manager who wants a simple mobile-first way to record money, understand spending and receive reliable guidance without needing accounting expertise.

### Secondary users

- Salaried users managing bills, EMI, savings and monthly cash flow.
- Freelancers or business owners with irregular income.
- Families tracking shared household spending.
- Users who prefer Hindi, Gujarati, Hinglish or Gujlish.
- Users preparing summaries and documents for a real Chartered Accountant.

### User characteristics

- May not be technically experienced.
- Expects clear language and low-friction entry.
- Needs trust, privacy and exact numbers.
- May have intermittent connectivity.
- May use older Android devices.

---

## 5. Product Goals

1. Preserve a trustworthy financial history across app restarts and upgrades.
2. Provide exact, deterministic spending and savings guidance.
3. Keep core ledger features functional offline.
4. Synchronize securely across devices when internet returns.
5. Provide an online AI CA Assistant grounded only in verified financial tools.
6. Support English, Hindi, Gujarati, Hinglish and Gujlish.
7. Support safe voice interaction with confirmation before writes.
8. Provide useful reports and export/share packages for a real CA.
9. Give the user clear ownership, export, restore and deletion controls.
10. Reach a production-ready Android release without weakening the v1.0.3 rollback baseline.

---

## 6. Non-Goals

Praxis Wealth will not:

- Act as a licensed human Chartered Accountant.
- File taxes, sign audits, certify accounts or provide binding legal conclusions.
- Let AI invent balances, spending totals, tax values or historical comparisons.
- Store AI provider credentials inside the APK.
- Require internet for normal ledger entry and local reports.
- Connect again to the temporary Emergent preview backend.
- Start banking, investment trading, lending or unrelated financial-market features unless added through a future approved roadmap revision.
- Replace the current stable checkpoint before backup, migration tests, real-device validation and rollback proof.

---

## 7. Non-Negotiable Product Principles

### 7.1 Deterministic numbers

All financial amounts shown as facts must come from verified database queries or deterministic calculation functions. AI may explain results but may not calculate authoritative totals independently.

### 7.2 Local-first reliability

The ledger, balances, budgets, goals, bills and stored reports remain usable without internet. Pending changes queue for later synchronization.

### 7.3 Explicit confirmation

AI and voice may create a draft action, but any action that changes a financial record requires explicit confirmation.

### 7.4 Secure backend boundary

The mobile app calls only the secure Praxis backend. AI provider keys and privileged credentials remain server-side.

### 7.5 Honest positioning

The assistant must identify itself as an **AI CA Assistant**, not a human CA.

### 7.6 User ownership

The user must be able to export data, restore data, delete cloud data and understand what is stored locally versus in the cloud.

---

## 8. Verified v1.0.3 APK Baseline Audit

### 8.1 Artifact identity

| Field | Verified value |
|---|---|
| APK filename | `Praxis-Wealth-v1.0.3-OFFLINE-FINAL.apk` |
| SHA-256 | `862706da137d642e0b5b372a46b0cdbad2f87fe98359b0bec13b4ebad66adca9` |
| App name | Praxis Wealth |
| Package | `com.emergent.aiwealthmanager.oaa4sb` |
| Version name | `1.0.3` |
| Version code | `3` |
| Main activity | `com.emergent.aiwealthmanager.oaa4sb.MainActivity` |
| Minimum Android SDK | 24 |
| Target Android SDK | 36 |
| Expo SDK | 54.0.0 |
| Architecture | Expo / React Native, Hermes bytecode, New Architecture enabled |
| EAS owner | `jokim22` |
| EAS project ID | `01b9c17d-d04c-4d0d-98cc-a1bde7450c82` |
| Signing | APK Signature Scheme v2 |
| Signing certificate SHA-256 | `6793c2ad48f8f27a755a07c041126982291af3706cb300b8a815d87404934527` |

### 8.2 Compiled-bundle findings

Verified absent:

- `preview.emergentagent.com`
- `/api/profile`
- `EXPO_PUBLIC_BACKEND_URL`
- obvious OpenAI or Anthropic provider names/keys

Verified present:

- `local://praxis-offline`
- `praxis_local_store_v2`
- `praxis_onboarded_v1`
- AsyncStorage runtime strings
- profile/transaction/budget/goal/bill/chat and finance-related field markers

Interpretation: the compiled APK matches the intended v1.0.3 offline hard-lock baseline. The generic `SQLite` string belongs to AsyncStorage's native implementation context and does not prove that Praxis already has the structured Phase 1 financial SQLite schema.

### 8.3 Expo and Android configuration findings

- Portrait orientation.
- Custom scheme: `praxiswealth`.
- Edge-to-edge mode enabled.
- Automatic light/dark interface style.
- Expo Router and typed routes configured.
- Expo OTA updates disabled in the installed binary.
- Android backup currently allowed.
- Universal APK contains ARM and x86 native libraries, increasing APK size.

### 8.4 Declared permissions

- Internet and network-state access.
- Biometric/fingerprint access.
- Vibration.
- Read/write external storage legacy permissions.
- System alert window.

No microphone permission was found, consistent with voice functionality not being complete in v1.0.3.

### 8.5 APK-level risks requiring later review

| Risk | Impact | Roadmap owner |
|---|---|---|
| `allowBackup=true` for a finance app | Local data may be included in platform backup depending on Android behavior and rules | Phase 9 |
| Legacy external-storage permissions | Broader permission footprint than expected | Phase 9 |
| `SYSTEM_ALERT_WINDOW` permission | Sensitive permission; likely unnecessary for production | Phase 9 |
| Universal APK includes four ABIs | Large binary size; not optimized for store distribution | Phase 10 |
| Internet permission exists in offline build | Acceptable for future architecture, but all active endpoints require source and runtime review | Phase 0/3 |
| Biometric permissions declared | Feature behavior and secure-storage integration are not proven by APK inspection | Phase 9 |
| Source revision not embedded | APK cannot prove Git commit, working tree, tests or source archive integrity | Phase 0 |

### 8.6 What the APK cannot prove

- Current Git branch, commit and dirty/clean status.
- Exact source file contents and maintainability.
- Complete screen/navigation inventory.
- Existing unit, integration and migration test coverage.
- Whether every UI flow works on a real device.
- Exact persistence behavior after restart for existing user data.
- Whether the APK corresponds byte-for-byte to the latest source folder.

Therefore the APK audit is **PASS as binary baseline evidence**, but Phase 0 remains incomplete until the latest source ZIP is audited, archived, tested and tied to a Git tag.

---

## 9. Functional Requirements

### 9.1 Onboarding and Profile

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-PRO-001 | The user can create and update a local profile. | Profile survives restart and upgrade. |
| FR-PRO-002 | Capture name, income pattern, balances and relevant planning preferences. | Fields validate and remain editable. |
| FR-PRO-003 | Support calendar-month, salary-date and custom monthly budget cycles. | Calculations use the selected cycle consistently. |
| FR-PRO-004 | Store interface language and AI reply-language preferences independently. | Both preferences persist after restart. |

### 9.2 Accounts and Ledger

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-LED-001 | Add, edit and delete income and expense transactions offline. | Totals reconcile after every mutation. |
| FR-LED-002 | Support accounts and opening/current balances. | Balance equals verified ledger result. |
| FR-LED-003 | Store category, date, amount, description, notes and source metadata. | Required fields validate; currency rounding is consistent. |
| FR-LED-004 | Preserve historical months. | Switching months never changes prior data. |
| FR-LED-005 | Support recurring income and expenses. | Generated entries are idempotent and never duplicate. |
| FR-LED-006 | Maintain audit metadata for edits/deletes. | Sync and reports can distinguish current state from deletion. |

### 9.3 Bills, EMI, Debt, Goals and Budgets

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-PLAN-001 | Track upcoming bills with due date, amount and recurrence. | Bill reserve includes applicable upcoming bills. |
| FR-PLAN-002 | Track EMI and debt obligations. | Monthly capacity deducts verified obligations. |
| FR-PLAN-003 | Create savings goals with target, deadline and progress. | Projection uses verified contributions and balance. |
| FR-PLAN-004 | Define total and category budgets. | Category totals reconcile with transaction data. |
| FR-PLAN-005 | Set emergency-reserve and savings-target policies. | Safe-spend calculation protects these amounts. |

### 9.4 Deterministic Financial Engine

Authoritative formulas:

```text
Spendable monthly amount =
Income
- Fixed bills
- EMI/debt
- Savings target
- Emergency reserve
```

```text
Remaining spending capacity =
Spendable monthly amount
- Current month variable expenses
```

```text
Safe daily spending =
Remaining spending capacity
/ Remaining days in the active budget cycle
```

Additional requirements:

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-CALC-001 | Calculate monthly spendable amount. | Matches fixtures exactly. |
| FR-CALC-002 | Calculate remaining capacity and safe daily spend. | Handles zero/negative capacity safely. |
| FR-CALC-003 | Reserve upcoming bills before presenting safe spend. | Every reserved bill is traceable. |
| FR-CALC-004 | Compare current month with last month and same-date position. | Date windows are equivalent. |
| FR-CALC-005 | Calculate three-month averages and category movement. | Missing months are handled explicitly. |
| FR-CALC-006 | Detect unusual transactions using deterministic rules. | Rule and threshold are shown or documented. |
| FR-CALC-007 | Project month-end balance and savings progress. | Projection labels assumptions and estimates. |
| FR-CALC-008 | No AI arithmetic is accepted as authoritative. | Every numeric AI answer references tool output. |

### 9.5 Local Persistence, Backup and Migration

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-DATA-001 | Use a structured versioned on-device financial database. | Schema version is recorded. |
| FR-DATA-002 | Safely migrate v1.0.3 local-store data to the new schema. | No loss, duplication or silent reset. |
| FR-DATA-003 | Recover from interrupted migration. | App resumes or rolls back safely. |
| FR-DATA-004 | Export and import a local backup. | Clean-device restore reproduces balances and history. |
| FR-DATA-005 | Protect against duplicate migrations and recurring entries. | Re-running migration is idempotent. |
| FR-DATA-006 | Preserve prior-month snapshots or reproducible historical aggregates. | Historical reports remain stable. |

### 9.6 Secure Cloud Account and Synchronization

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-SYNC-001 | Authenticate users through a secure backend. | Sessions expire and refresh safely. |
| FR-SYNC-002 | Queue offline mutations and sync after reconnection. | No local action is lost. |
| FR-SYNC-003 | Implement deterministic conflict resolution. | Same input produces same result on all devices. |
| FR-SYNC-004 | Support deletion tombstones. | Deleted records do not reappear. |
| FR-SYNC-005 | Prevent duplicate records during retries. | Idempotency keys or equivalent controls work. |
| FR-SYNC-006 | Show sync status and actionable errors. | User can distinguish local-save from cloud-sync state. |
| FR-SYNC-007 | Restore data on a second device. | Verified account data reconstructs correctly. |
| FR-SYNC-008 | Backend failure must not break the ledger. | Local actions continue and queue. |

### 9.7 Online AI CA Assistant

Controlled tool boundary:

```text
get_month_summary
compare_months
get_category_spending
calculate_safe_spend
list_upcoming_bills
add_transaction_draft
confirm_transaction
update_budget
get_savings_projection
build_tax_summary
prepare_ca_report
```

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-AI-001 | Mobile calls only the secure Praxis backend for AI. | Provider secrets are absent from APK and logs. |
| FR-AI-002 | AI reads financial data only through approved tools. | No unrestricted database access. |
| FR-AI-003 | Every financial amount is traceable to a tool result. | Tool call and data scope are auditable. |
| FR-AI-004 | Money-changing requests create drafts first. | No write before confirmation. |
| FR-AI-005 | AI handles unavailable internet/provider cleanly. | Ledger remains usable; message is honest. |
| FR-AI-006 | AI communicates uncertainty and professional limits. | High-risk conclusions recommend human review. |
| FR-AI-007 | Rate and cost controls prevent uncontrolled usage. | Limits and fallback behavior are tested. |
| FR-AI-008 | Prompt injection cannot reveal secrets or bypass authorization. | Adversarial tests pass. |

### 9.8 Language Support

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-LANG-001 | Support English, Hindi and Gujarati UI. | Core flows contain no untranslated required text. |
| FR-LANG-002 | Understand and reply in Hinglish and Gujlish. | Mixed-language test suite passes. |
| FR-LANG-003 | Auto-detect chat language with manual override. | Wrong detection can be corrected. |
| FR-LANG-004 | Format Indian currency and dates consistently. | Values remain numerically identical across languages. |
| FR-LANG-005 | Preserve language preferences after restart and sync. | Settings are stable across devices. |

### 9.9 Voice CA

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-VOICE-001 | Request microphone permission only when needed. | Denial does not break text chat. |
| FR-VOICE-002 | Show recognized transcript before action. | User can edit or cancel. |
| FR-VOICE-003 | Support English/Hindi/Gujarati and mixed speech. | Target phrases meet acceptance threshold. |
| FR-VOICE-004 | Convert write intents into drafts. | Confirmation is mandatory. |
| FR-VOICE-005 | Provide optional spoken replies. | User can disable playback. |
| FR-VOICE-006 | Explain audio retention and processing. | Privacy disclosure is visible and accurate. |

### 9.10 Chat and Keyboard UX

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-CHAT-001 | Composer remains above Android keyboard. | Never hidden on target devices. |
| FR-CHAT-002 | Latest message auto-scrolls into view. | Works during streaming and keyboard changes. |
| FR-CHAT-003 | Draft survives keyboard open/close and temporary navigation. | Text is not lost. |
| FR-CHAT-004 | Send, microphone and language controls remain visible. | Works with large text and safe areas. |
| FR-CHAT-005 | Failed messages can be retried. | No duplicate financial action occurs. |
| FR-CHAT-006 | Show network and generation state. | User knows whether message is pending, failed or complete. |
| FR-CHAT-007 | Long conversations remain performant. | Defined performance test passes. |

### 9.11 Insights, Reports and Human-CA Sharing

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-REP-001 | Generate weekly and monthly reports. | Totals reconcile with ledger. |
| FR-REP-002 | Show savings, budget health and category trends. | Score logic is deterministic and documented. |
| FR-REP-003 | Export PDF and CSV. | Phone opens files; dates/currency are correct. |
| FR-REP-004 | Prepare a human-CA share package. | Sensitive sharing requires confirmation. |
| FR-REP-005 | Provide tax-document checklist and estimate labeling. | Estimates are never represented as filed returns. |

### 9.12 Privacy and User Controls

| ID | Requirement | Acceptance summary |
|---|---|---|
| FR-PRIV-001 | Clearly disclose local and cloud storage. | Privacy center matches actual implementation. |
| FR-PRIV-002 | Export user data in usable formats. | Export is complete and readable. |
| FR-PRIV-003 | Delete cloud account and cloud data. | Deletion is verifiable and irreversible after grace policy. |
| FR-PRIV-004 | Review Android permissions and request only when necessary. | Unneeded sensitive permissions are removed. |
| FR-PRIV-005 | Redact secrets and sensitive data from logs. | Security tests confirm no leakage. |

---

## 10. Key User Journeys

### Journey A: First-time offline onboarding

1. User opens the app without internet.
2. User creates a profile and sets monthly income/budget-cycle preferences.
3. App stores the profile locally.
4. User enters an expense.
5. Dashboard updates using deterministic calculations.
6. User force-closes and reopens the app.
7. Data remains available.

### Journey B: Ask safe-spending question

1. User asks: “Is month main kitna aur spend kar sakta hoon?”
2. AI invokes verified finance tools.
3. Deterministic engine calculates income, obligations, reserves and current expenses.
4. AI explains the tool result in the user's language.
5. Response states assumptions if data is incomplete.

### Journey C: Voice transaction

1. User says: “450 rupees petrol expense add karo.”
2. App displays recognized text.
3. System creates a transaction draft.
4. Assistant asks: “₹450 petrol expense add kar doon?”
5. User confirms.
6. Local transaction saves immediately and queues for sync if offline.

### Journey D: Offline-to-online synchronization

1. User adds records offline.
2. UI shows “Saved locally; sync pending.”
3. Internet returns.
4. Queue retries with idempotency protection.
5. Conflicts resolve deterministically.
6. UI shows last successful sync.

### Journey E: Prepare report for a real CA

1. User selects a date range and report type.
2. App validates ledger totals.
3. App generates report and supporting CSV/PDF files.
4. User reviews sensitive content.
5. User explicitly confirms sharing/export.

---

## 11. Conceptual Data Model

Core entities planned for Phase 1 and later:

- `schema_metadata`
- `profile`
- `accounts`
- `categories`
- `transactions`
- `recurring_rules`
- `bills`
- `debts`
- `emi_schedules`
- `savings_goals`
- `budgets`
- `budget_cycles`
- `monthly_snapshots`
- `sync_queue`
- `sync_state`
- `deletion_tombstones`
- `chat_threads`
- `chat_messages`
- `ai_action_drafts`
- `audit_events`

Every financial record requires a stable unique ID, owner scope, created/updated timestamps, deletion state and synchronization version metadata where applicable.

---

## 12. Target Architecture

```text
Android / Expo Application
├── Versioned SQLite financial ledger
├── Repository and service layer
├── Deterministic financial calculation engine
├── Offline transaction queue
├── Secure local session storage
├── Multilingual chat and voice UI
└── Local reports and cached summaries
          │
          │ TLS + authenticated API
          ▼
Secure Praxis Backend
├── Authentication and authorization
├── User-isolated cloud financial database
├── Synchronization API
├── Controlled AI tool gateway
├── AI orchestration and language handling
├── Speech services
├── Audit logs and rate controls
└── Export, deletion, observability and recovery
```

Architecture rules:

- Mobile never contains provider secrets.
- Backend never becomes a hard dependency for local ledger operation.
- AI never receives unrestricted database access.
- Calculation results are produced by deterministic services.
- Synchronization is idempotent and conflict behavior is documented.

---

## 13. Non-Functional Requirements

### Reliability

- No data loss during app restart, upgrade or interrupted migration.
- Local writes complete independently of network availability.
- Restore procedure is tested, not merely documented.

### Security

- TLS for all remote traffic.
- User data isolated by authorization at every backend query.
- Secrets absent from APK, source-control history, crash reports and logs.
- Sensitive Android permissions minimized.

### Performance

- Common dashboard and ledger operations should feel immediate on supported devices.
- Long transaction histories and chats must use pagination/virtualization.
- Sync and report generation must not block normal entry.

### Accessibility

- Large text support.
- Screen-reader labels for financial controls.
- Sufficient contrast.
- Touch targets appropriate for mobile use.
- Keyboard and voice are alternatives, not dependencies.

### Compatibility

- Preserve Android 7+ support unless a later phase documents a justified change.
- Real-device testing must cover at least one low/mid-range Android device and one current Android version.

### Observability

- Record sync failures, migration failures, backend errors and AI tool errors without logging sensitive financial content or secrets.

---

## 14. Success Measures

Production success requires evidence, not feature claims:

- 100% of authoritative financial amounts trace to deterministic calculation or database output.
- 0 confirmed data-loss defects in migration/upgrade acceptance fixtures.
- 0 financial writes from AI/voice without explicit confirmation.
- Offline ledger acceptance passes with backend unavailable.
- Sync retry tests create no duplicate transactions.
- Core flows pass in English, Hindi and Gujarati.
- Keyboard composer remains visible on real Android devices.
- Export/restore and account deletion are proven end-to-end.
- Secrets are absent from compiled mobile bundles and logs.

Numeric product analytics targets may be added after privacy-safe telemetry requirements are approved.

---

## 15. Roadmap-to-PRD Traceability

| Roadmap phase | PRD capability | Release target |
|---|---|---|
| Phase 0 | Baseline preservation, audit, rollback and regression proof | v1.0.3 freeze |
| Phase 1 | Structured financial memory and migration | v1.1.0 |
| Phase 2 | Deterministic budget intelligence | v1.2.0 |
| Phase 3 | Secure cloud account and synchronization | v1.3.0 |
| Phase 4 | Controlled online AI CA Assistant | v1.4.0 |
| Phase 5 | English/Hindi/Gujarati and mixed-language support | v1.5.0 |
| Phase 6 | Voice CA with confirmation | v1.6.0 |
| Phase 7 | Chat and Android keyboard UX | v1.7.0 |
| Phase 8 | Insights, reports and human-CA sharing | v1.8.0 |
| Phase 9 | Security, privacy and reliability hardening | v1.9.0 |
| Phase 10 | Production build, store release and rollback package | v2.0.0 |

No row may be marked complete without its roadmap acceptance gates and real-device validation.

---

## 16. Phase 0 Product Acceptance Contract

Phase 0 is complete only when all of the following pass:

### Artifact preservation

- Stable APK copied and SHA-256 recorded.
- Complete source archive created and hash recorded.
- Git repository bundle or equivalent full-history recovery artifact created.
- Dependency lock and Expo configuration snapshot stored.

### Source provenance

- Current branch, HEAD, remote and working-tree state recorded.
- Source is tied to the stable APK as closely as available evidence permits.
- Annotated tag `praxis-v1.0.3-stable-offline` created only after validation.

### Regression gates

- App opens.
- Onboarding works.
- Ledger entry works.
- Old `/api/profile` 404 remains absent.
- Local data survives force-close/restart.
- Existing tests pass.
- `npm run check:build` passes.
- Expo config and Expo Doctor pass.
- Compiled Android bundle contains no old backend URL.

### Restore proof

- Source archive restores into a clean folder.
- Dependencies install from lockfile.
- Validation and Android export succeed in the restored copy.
- Rollback instructions are executable and clear.

### Real-phone acceptance

- Correct version/package installed.
- No 404 regression.
- Existing core screens work.
- Offline ledger continues to function.
- Persistence is verified after restart.

### Current Phase 0 status

| Gate | Status |
|---|---|
| Roadmap and handover read | PASS |
| Uploaded APK identity audit | PASS |
| Old backend markers absent in APK | PASS |
| Offline markers present in APK | PASS |
| APK hash and signing fingerprint recorded | PASS |
| Latest source ZIP audit | BLOCKED - source ZIP not uploaded |
| Git/tag verification | BLOCKED - source repository unavailable |
| Automated source tests | BLOCKED - source repository unavailable |
| Restore drill | BLOCKED - source repository unavailable |
| Real-phone persistence acceptance in this phase | PENDING |

**Phase 1 must not begin until every Phase 0 blocker is resolved.**

---

## 17. Major Product Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Existing local JSON data is lost during SQLite migration | Versioned migration, pre-migration backup, idempotency and fixture-based restore tests |
| AI provides incorrect amounts | Controlled tools, deterministic calculations and amount traceability |
| Sync creates duplicates or resurrects deletions | Idempotency, conflict rules and deletion tombstones |
| Backend outage breaks app | Local-first ledger and queued synchronization |
| Sensitive data leaks through logs or APK | Secret scanning, log redaction and bundle audit |
| Gujarati/Hinglish intent is misunderstood | Mixed-language fixtures, confirmation and edit/cancel flow |
| Voice creates wrong transaction | Display transcript, draft action and mandatory confirmation |
| Keyboard blocks chat composer | Dedicated Phase 7 real-device acceptance; earlier minimal fix only if development is blocked |
| Scope drifts into unrelated features | Roadmap/PRD traceability and change-control gate |
| Stable rollback is overwritten | Immutable archive, tag, hash and restore drill |

---

## 18. Open Decisions (Do Not Block Phase 0)

These decisions belong to their roadmap phases and should not trigger out-of-order implementation:

- Cloud provider, database and authentication technology.
- AI model/provider and routing strategy.
- Speech-to-text and text-to-speech providers.
- Conflict-resolution details for simultaneous edits.
- Encryption-at-rest strategy and Android backup policy.
- Final tax-estimate scope and human-CA disclaimer wording.
- Privacy-safe analytics and crash-reporting providers.
- Play Store distribution strategy, ABI splits and app-bundle configuration.

Each decision requires a short architecture decision record during the owning phase.

---

## 19. Definition of Done for Every Phase

```text
Read source and roadmap
→ Audit current behavior
→ Create rollback backup
→ State exact phase scope
→ Implement the entire phase as one cohesive bunch
→ Run unit/integration/migration tests
→ Run prior-feature regression
→ Run Expo Doctor
→ Validate backend where applicable
→ Inspect compiled bundle where relevant
→ Build one APK after pre-build gates pass
→ Run real-phone acceptance
→ Produce one combined PASS/FAIL report
→ Commit and push immediately after full PASS
→ Update roadmap and PRD traceability status
```

A failed gate must remain visible. The earliest real failure must be repaired and the relevant complete validation rerun before PASS is claimed.

---

## 20. Immediate Next Action

Upload the latest complete Praxis Wealth v1.0.3 source ZIP from the PC when available. Then execute Phase 0 as a read-only provenance audit first:

1. Hash and extract the source into a separate audit directory.
2. Record Git branch, HEAD, remote and working-tree status.
3. Inventory source, screens, routes, storage, API layer, tests and Expo configuration.
4. Compare source identifiers and compiled markers with the audited APK.
5. Create source/APK/Git recovery artifacts.
6. Run the complete Phase 0 validation and restore drill.
7. Perform one real-phone acceptance cycle.
8. Commit Phase 0 evidence, create the stable tag and push after full PASS.

Only then may development continue to Phase 1.

---

## Appendix A - Evidence Sources

- `Praxis_Wealth_Online_AI_Roadmap_v2(1).md`
- `Praxis_Wealth_Master_Handover_Prompt(1).md`
- `Praxis-Wealth-v1.0.3-OFFLINE-FINAL.apk`
- Direct APK manifest, resource, signing and Hermes-bundle audit performed on 20 July 2026

## Appendix B - Baseline Fingerprints

```text
APK SHA-256:
862706da137d642e0b5b372a46b0cdbad2f87fe98359b0bec13b4ebad66adca9

Signing certificate SHA-256:
6793c2ad48f8f27a755a07c041126982291af3706cb300b8a815d87404934527

Package:
com.emergent.aiwealthmanager.oaa4sb

Version:
1.0.3 (versionCode 3)

Planned stable tag:
praxis-v1.0.3-stable-offline
```
