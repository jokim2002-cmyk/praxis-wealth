# Praxis Wealth — Online AI CA Roadmap
## Canonical Product & Development Roadmap

**Roadmap status:** Active  
**Current stable checkpoint:** Praxis Wealth v1.0.3 Offline  
**Next planned release:** v1.1.0 Hybrid Financial Memory  
**Canonical architecture:** Local-first ledger + secure cloud sync + online multilingual AI CA + voice

---

## 1. Product Vision

Praxis Wealth will become a personal finance app that:

- remembers income, expenses, savings, bills, EMI/debt, goals, budgets and month-by-month history;
- calculates exact spending capacity using deterministic financial logic;
- provides an online AI CA Assistant in English, Hindi, Gujarati, Hinglish and Gujlish;
- supports text and voice commands;
- remains a reliable ledger when internet is unavailable;
- securely syncs data when internet returns;
- keeps AI credentials and private secrets outside the APK;
- provides current-month guidance, previous-month comparison, savings projections and reports.

Praxis Wealth must not become either a fully offline app with no useful AI or a fully online app that becomes unusable when the backend is down.

```text
On-device financial ledger
        +
Secure cloud account and synchronization
        +
Online multilingual AI CA
        +
Voice input and spoken replies
```

---

## 2. Current Stable Checkpoint — v1.0.3

### Confirmed working

- Android APK installs and opens.
- The previous `/api/profile` 404 error is removed.
- Onboarding and ledger work without the old Emergent preview backend.
- Compiled Android bundle audit confirmed the old backend URL was absent.
- Local-only hard lock was present before the v1.0.3 build.
- Expo Doctor and build validation passed.
- User confirmed the 404 error is gone.

### Current identifiers

```text
Project path:
C:\Users\Admin\Downloads\PRAXIS_WEALTH_APK_BUILD\Hunter-Wealth-Manager-main\frontend

Expo project:
@jokim22/praxis-wealth

Android package:
com.emergent.aiwealthmanager.oaa4sb

Last known validated Git checkpoint:
bd92445
```

### Current limitations

- The app is primarily offline.
- Secure cloud account, backup, restore and multi-device sync are not complete.
- Production online AI CA is not complete.
- Hindi and Gujarati AI chat are not production-ready.
- Voice command flow is not complete.
- Chat composer can hide behind the Android keyboard.
- Financial memory needs a structured persistent database.
- Human-CA report sharing is not complete.

### Golden rule

Keep v1.0.3 source and APK as the rollback checkpoint. No phase may weaken or overwrite it without:

```text
Backup
→ Migration plan
→ Automated tests
→ Real-device validation
→ Rollback path
```

---

## 3. Non-Negotiable Product Rules

### Exact numbers come from code, not AI

The AI must never invent income, expense, balance, tax, budget or historical numbers.

A deterministic finance engine calculates:

```text
Spendable monthly amount
Remaining spending capacity
Safe daily spending
Savings projection
Upcoming-bill reserve
Category limits
Month-over-month comparison
Three-month averages
```

The AI explains verified outputs in the user's language.

### AI keys never go inside the APK

The APK calls only the secure Praxis backend. AI provider credentials remain server-side.

### Local-first operation

Without internet, these must continue working:

- add/edit/delete income and expenses;
- balances and dashboard;
- current-month and stored previous-month reports;
- bills, budgets and savings goals;
- queued synchronization.

Online-only AI features may show an internet-required message, but the ledger must not stop working.

### Human confirmation

Any AI or voice command that changes money records requires confirmation:

```text
“₹450 petrol expense add kar doon?”
```

### Honest CA positioning

The product is an **AI CA Assistant**, not a licensed human Chartered Accountant.

It may provide budgeting, expense analysis, tax estimates, explanations, checklists and report preparation. Final filing, audit, certification and legal conclusions require qualified professional review.

---

## 4. Target Architecture

### Mobile app

- SQLite financial database;
- encrypted session storage;
- offline transaction entry;
- deterministic local calculations;
- sync queue and status;
- multilingual chat UI;
- voice capture;
- cached summaries;
- local report access.

### Secure backend

- authentication;
- user-specific cloud database;
- synchronization APIs;
- AI orchestration;
- controlled financial tools;
- chat-memory summaries;
- speech-to-text and text-to-speech;
- rate limits and usage controls;
- audit logs;
- export and deletion;
- observability and recovery.

### Controlled AI tools

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

The AI must not have unrestricted database access.

---

## 5. Core Financial Intelligence

### Monthly spending capacity

```text
Spendable monthly amount =
Monthly income
− Fixed bills
− EMI/debt
− Savings target
− Emergency reserve
```

```text
Remaining spending capacity =
Spendable monthly amount
− Current month variable expenses
```

```text
Safe daily spending =
Remaining spending capacity
÷ Remaining days in the budget cycle
```

### Historical intelligence

Praxis must calculate and explain:

- last-month total expense;
- last-month expense up to the same date;
- current-month total;
- category increases/decreases;
- three-month averages;
- unusual transactions;
- upcoming bills;
- savings-rate trend;
- projected month-end balance;
- safe additional spending.

The budget cycle must support calendar month, salary-date month and a custom monthly cycle.

---

## 6. Multilingual AI CA

Required modes:

```text
English
हिन्दी
ગુજરાતી
Auto-detect
```

Support English, Hindi, Gujarati, Hinglish, Gujlish and mixed Indian finance vocabulary such as EMI, SIP, GST, tax, budget, bill, saving and kharcha.

Examples:

```text
इस महीने मैं कितना और खर्च कर सकता हूँ?
આ મહિને હું હજી કેટલો ખર્ચ કરી શકું?
Is month savings target maintain karne ke liye kitna spend kar sakta hoon?
Aa month ma safe spending limit ketli baki chhe?
```

Interface language and AI reply language should be independently configurable.

---

## 7. Voice CA

Example commands:

```text
“450 rupees petrol expense add karo.”
“આ મહિને મારો કુલ ખર્ચ કેટલો થયો?”
“Last month ke comparison mein food expense batao.”
“Is month main kitna aur spend kar sakta hoon?”
“₹5,000 ka electricity bill next week ke liye add karo.”
```

Flow:

```text
Voice
→ Speech-to-text
→ Language detection
→ Intent extraction
→ Deterministic calculation or transaction draft
→ Confirmation
→ Save
→ Optional spoken reply
```

Requirements:

- show recognized text;
- confirm money-changing actions;
- allow edit/cancel;
- handle uncertain Gujarati or mixed-language recognition;
- clearly state audio retention behavior;
- text chat remains available when microphone access is denied.

---

## 8. Chat UX Requirements

The Android keyboard-overlap issue must be fixed.

Required behavior:

- composer remains above the keyboard;
- Android resize behavior is correct;
- safe-area inset is respected;
- latest message auto-scrolls into view;
- draft survives keyboard open/close;
- multiline input has a maximum height;
- send and mic remain visible;
- failed messages can be retried;
- connection status is visible;
- language switch is available;
- long chats remain performant;
- large text remains usable.

---

# 9. Canonical Roadmap

## Phase 0 — Preserve and Audit v1.0.3

**Objective:** Freeze the working rollback baseline before hybrid development.

Complete bunch:

- source and APK backup;
- Git tag/checkpoint;
- schema and screen inventory;
- current local-storage audit;
- regression checklist;
- rollback instructions;
- dependency lock snapshot;
- Expo configuration snapshot.

Acceptance:

- app opens;
- onboarding and ledger work;
- old 404 stays removed;
- local data survives restart;
- backup restores;
- tests and Expo Doctor pass;
- tag/checkpoint recorded.

Target tag:

```text
praxis-v1.0.3-stable-offline
```

---

## Phase 1 — v1.1.0 Hybrid Financial Memory

**Objective:** Structured persistent finance memory with safe migration.

Complete bunch:

- SQLite and schema versioning;
- profile;
- accounts and balances;
- income/expense transactions;
- categories;
- recurring bills;
- EMI/debt;
- savings goals;
- budgets;
- monthly snapshots;
- migration from current local store;
- repository/service layer;
- monthly aggregation;
- interrupted-migration recovery;
- local backup import/export;
- persistence and migration tests.

Acceptance:

- existing data migrates without loss;
- restart retains all data;
- month switching works;
- totals match fixtures;
- no duplicate migrations;
- real-device regression passes.

---

## Phase 2 — v1.2.0 Smart Budget Engine

**Objective:** Exact answers about spending, saving and month-end risk.

Complete bunch:

- monthly spendable amount;
- remaining spending capacity;
- safe daily spending;
- savings protection;
- emergency reserve;
- upcoming-bill reserve;
- category budgets;
- overspending detection;
- month-end projection;
- last-month same-date comparison;
- three-month averages;
- anomaly detection;
- configurable budget cycle;
- explanation cards;
- deterministic unit tests.

Acceptance:

- all calculations match fixtures;
- negative capacity handled safely;
- month-length/leap-year cases pass;
- category totals reconcile;
- no AI arithmetic.

---

## Phase 3 — v1.3.0 Secure Cloud Backend and Sync

**Objective:** Account, backup, restore and multi-device readiness without weakening offline use.

Complete bunch:

- secure authentication;
- cloud financial schema;
- encrypted transport;
- sync API;
- offline change queue;
- push/pull sync;
- deterministic conflict resolution;
- deletion tombstones;
- retry/backoff;
- sync-status UI;
- cloud backup/restore;
- export/delete account;
- session expiry;
- server validation;
- audit logs.

Acceptance:

- offline entries sync after reconnection;
- no duplicate transactions;
- second-device restore succeeds;
- client contains no secrets;
- backend failure does not break ledger.

---

## Phase 4 — v1.4.0 Online AI CA Assistant

**Objective:** Secure AI that understands verified ledger data.

Complete bunch:

- backend AI integration;
- safety prompts;
- controlled financial tools;
- user-specific context;
- monthly summaries;
- month comparisons;
- category analysis;
- safe-spend calculation;
- upcoming bills;
- transaction drafts;
- savings projection;
- tax summary;
- report preparation;
- streaming;
- retry/error handling;
- rate/cost controls;
- human-CA escalation;
- uncertainty handling.

Acceptance:

- every amount traces to tool output;
- money changes require confirmation;
- secrets stay server-side;
- AI outage is handled cleanly;
- offline ledger remains usable.

---

## Phase 5 — v1.5.0 English, Hindi, Gujarati, Hinglish and Gujlish

Complete bunch:

- translation framework;
- three-language UI;
- auto-detect chat language;
- same-language replies;
- Indian currency/date formatting;
- finance glossary;
- mixed-language tests;
- untranslated-text detector;
- language preference memory;
- response-style preference.

Acceptance:

- onboarding works in all three languages;
- calculations are identical across languages;
- Gujarati/Hindi render correctly;
- mixed-language chat works;
- language persists after restart.

---

## Phase 6 — v1.6.0 Voice CA

Complete bunch:

- microphone permission;
- recording;
- speech-to-text;
- English/Hindi/Gujarati recognition;
- Hinglish/Gujlish handling;
- intent parser;
- transaction draft;
- mandatory confirmation;
- edit/cancel;
- spoken reply;
- text fallback;
- privacy notice;
- poor-network recovery.

Acceptance:

- target-language phrases work;
- uncertainty asks for clarification;
- no financial write without confirmation;
- microphone denial does not break text chat.

---

## Phase 7 — v1.7.0 Chat and Keyboard UX Repair

Complete bunch:

- Android keyboard-overlap fix;
- composer above keyboard;
- safe-area handling;
- auto-scroll;
- draft retention;
- typing/loading state;
- cancel generation;
- retry;
- network indicator;
- mic button;
- language switch;
- history/search/delete;
- accessibility;
- long-chat performance;
- real-device keyboard testing.

Acceptance:

- composer never hides;
- send/mic remain visible;
- latest response is visible;
- large-font mode works;
- temporary network failure does not lose messages.

---

## Phase 8 — v1.8.0 Insights, Reports and Human-CA Sharing

Complete bunch:

- weekly/monthly reports;
- savings score;
- budget-health score;
- category trends;
- anomaly alerts;
- upcoming-pressure forecast;
- month-over-month explanation;
- PDF report;
- CSV export;
- human-CA share package;
- tax-document checklist;
- user-controlled reminders.

Acceptance:

- reports reconcile with ledger;
- exports use correct date/currency;
- sensitive sharing requires confirmation;
- phone can open generated reports;
- estimates are clearly labeled.

---

## Phase 9 — v1.9.0 Security, Privacy and Reliability

Complete bunch:

- threat model;
- secure storage review;
- authorization audit;
- user-data isolation;
- rate limits;
- input validation;
- log redaction;
- crash monitoring;
- AI safety audit;
- backup recovery drill;
- export/delete validation;
- privacy center;
- consent screens;
- dependency review;
- Android permission review;
- disaster recovery.

Acceptance:

- users cannot access each other's data;
- secrets are absent from bundles/logs;
- account deletion works;
- backup restore is proven;
- blockers are closed or documented.

---

## Phase 10 — v2.0.0 Production Release

Complete bunch:

- full regression;
- real-device acceptance;
- optimization;
- production backend;
- production environment variables;
- cost monitoring;
- Play Store assets;
- privacy policy;
- terms and AI disclaimer;
- signed production build;
- staged rollout;
- rollback build;
- source archive;
- final roadmap report;
- commit, tag and push.

Final acceptance:

- offline ledger works;
- cloud sync works;
- multilingual AI works;
- voice works;
- keyboard issue is fixed;
- calculations are exact;
- data survives upgrades;
- privacy controls work;
- production secrets remain server-side.

---

## 10. Testing Strategy

Every phase includes:

```text
Unit tests
Integration tests
Migration tests
Offline/online transition tests
API contract tests
AI tool-output tests
Multilingual tests
Keyboard/UI tests
Real Android phone acceptance
Regression against the previous stable version
```

Critical fixtures:

- zero income;
- multiple incomes;
- negative balance;
- fixed bills greater than income;
- salary-date cycle;
- edited/deleted transactions;
- recurring EMI;
- upcoming bill reserve;
- missing previous month;
- leap year;
- currency rounding;
- sync conflicts;
- repeated voice command;
- AI tool failure.

---

## 11. Mandatory Development Workflow

The user prefers complete roadmap phases as one cohesive coding bunch.

```text
Read roadmap and source
→ Audit current implementation
→ Create phase backup
→ Implement the entire phase
→ Run automated tests
→ Run previous-feature regression
→ Run Expo Doctor
→ Validate backend where applicable
→ Build one APK
→ Real-phone acceptance
→ One combined PASS/FAIL report
→ Commit and push immediately after full PASS
→ Update roadmap status
```

Rules:

- avoid unnecessary micro-phases;
- ask troubleshooting/visual questions directly in chat;
- provide complete PowerShell blocks;
- include exact `Set-Location`;
- use `npx.cmd`, not bare `npx`;
- never use `npm audit fix --force`;
- avoid duplicate EAS builds;
- do not hide failed gates.

---

## 12. Immediate Next Action

The new development chat must begin with **Phase 0 — Stable Baseline Audit and Freeze**.

First inspect:

- this roadmap;
- master handover prompt;
- latest v1.0.3 source ZIP;
- current `package.json`;
- `app.json`;
- `eas.json`;
- `src/utils/api.ts`;
- local-storage/database code;
- screens/navigation;
- tests;
- supplied build logs.

Then provide:

1. confirmed status;
2. source risks;
3. cohesive Phase 0 plan;
4. files expected to change;
5. validation gates;
6. rollback plan.

Do not begin Phase 1 until Phase 0 is backed up and validated.

---

## Canonical Product Statement

> Praxis Wealth is a local-first personal finance app with secure cloud synchronization and an online multilingual AI CA Assistant. It remembers the user's financial history, calculates exact spending and savings guidance, supports English, Hindi and Gujarati text/voice interaction, and remains a usable ledger when internet or AI services are unavailable.
