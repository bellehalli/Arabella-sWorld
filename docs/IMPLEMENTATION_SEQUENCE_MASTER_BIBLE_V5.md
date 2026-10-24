# DreamHub implementation sequence — Master Bible v5

**Working order set with Belle — 2026-10-24**

1. Finish the product workflows and their advanced capabilities.
2. Run the dedicated security and privacy phase.
3. Complete visual design and accessibility polish.
4. Complete the broader automation phase.

This sequence governs feature development on `main`, the current reference branch. Merged work is not a production release. No production deployment or user-data migration is part of these phases.

## Starting point

The current source inventory contains 46 navigation routes and 74 typed record forms, including the ten §5 advanced systems, a 16-week Academy scaffold, local encrypted backup/restore, and a local approval-based Automation Atelier. Source counts are generated from `catalog.mjs`; a route or form alone does not count as a complete advanced workflow. Capture & Continuity, Planning, and Studio/Finance/Home route acceptance are merged to `main` (PRs #19, #20, and #23). Career, wellness/care, relationships/pets/experiences/library, Grimoire, and Dream Estate route journeys and the new Career/statement-reconciliation acceptance flows are implemented and covered by focused automated/UI tests. Live financial account connections remain outside the local/manual product phase. Merged development work is not a production release.

## Phase 1 — Product workflows and advanced capabilities

Build against the Bible's route and journey contracts. Complete existing modules before adding a duplicate screen for a capability already present under another name.

### Capture, records, search, and continuity

- [x] Universal capture from every route with title, optional date, notes, labels, privacy choice, and local inbox routing. Undated thoughts stay undated.
- [x] Advanced inbox: bulk select/sort/archive/label edits, snooze with due-date return and undo, individual conversion to task/project/event/expense/memory, and reversible conversion are implemented.
- [x] Global search: query, type/date/label filters, saved/reusable searches, recent places, module scopes, and privacy-safe matching are implemented.
- [x] User-owned collections, reusable templates, backlinks, related-record views, and a browsable relationship graph.
- [x] Duplicate suggestions and validated custom fields use explicit review and recoverable merge; imports preview additions, identical records and conflicts, preserve current versions on approved merge, and record source provenance.
- [x] Align journal/diary/reflection tools: notebooks, guided and reusable templates, private passage search, version recovery, and printable/readable exports.
- [x] Complete Future Self letters with dated in-app reveal, annual review, and source-linked year-in-moments workflow.

### Executive function and planning

- [x] Task model: linked subtasks, next physical action, stuck reason, context, dependency gating, location, and fixed/before/window/someday due-date workflows.
- [x] Calendar: day/week/month planning, timezone-aware all-day and timed events, DST gap/fold choices, conflict review, ICS import/export, and manual approval for writes.
- [x] Recurrence with explicit daily/weekly/monthly rule semantics, pause/skip/resume, bounded deduplication, timezone handling, and DST tests.
- [x] Routine and habit templates, weekly targets, pause controls, retained neutral history, and unique weekly progress counts.
- [x] Weekly reset, minimum-viable-day and capacity/overwhelm views, time-budget warnings, and user-selected task priorities.
- [x] Day Director: preview a realistic day from confirmed shifts, appointments, caregiving, commute/prep/recovery buffers, task deadlines/dependencies, energy and a focus cap; review conflicts/deferred work; adjust or omit blocks; save only after explicit approval. Existing commitments and due dates stay fixed; superseded generated blocks remain recoverable.
- [x] Focus workflow: ready-task linking, timer controls, break flow, optional local sound, parking lot, and bounded session history.
- [x] Goal hierarchy, milestones, linked tasks/projects, qualitative progress, and previewed, user-approved dream-to-plan conversion.

### Personal operations

- [x] Career: application-linked interview preparation and outcomes, resume/portfolio version inventory, source links, contacts, idempotent dated follow-up tasks, and transparent gross compensation comparisons with visible hours, paid/unpaid weeks, and unmonetized benefit notes.
- [x] Studio: scope and exact-cent quote builder, accepted-scope milestones, expected vs received payment records, revision/change log, deliverables, outreach log, launch QA, and estimates distinct from invoices and received cash.
- [x] Finance: manual account balances, confirmed vs expected income, envelope/category plans, bills/subscriptions, sinking funds, affordability and cashflow scenarios with visible assumptions, duplicate-aware CSV review, and manual reconciliation suggestions. Reconciliation requires exact amount/direction and a bounded posting-date window; ambiguous candidates stay unchecked. Live bank feeds remain outside this local/manual workflow.
- [x] Home/admin: entered-cost apartment comparison, preview-and-approve moving timeline, inventory, warranties, recurring maintenance, errands, document checklist, and renewal tracking.
- [x] Wellness/care: optional dated routine logs, healthcare appointment preparation, configurable routines and product inventory in a separate encrypted local care vault; no diagnostic claims. The care vault does not sync with the main workspace.
- [x] Relationships/pets/experiences/library: opt-in in-app occasion reminders, editable contact and pet-care schedules, visited-vs-wished tracking, and media progress with user-entered source/location details. No outreach or background delivery is implied.
- [x] Grimoire/dreams: editable spreads and positions, manual card entries with upright/reversed orientation, personal correspondences and optional sources, symbol search, and reflective framing.
- [x] Dream Estate: route-complete accessible 2D navigation with keyboard movement and a plain-dashboard escape; no essential action depends on animation.

### Feature phase acceptance

- [x] Route acceptance: every route renders with empty data; every typed editor saves edits without changing its privacy setting; settings expose whole-workspace export; trash/restore, visible save failure, and all literal rendered actions are checked.
- [x] Native controls have accessible names and use button/link semantics; delegated click activation is tested. High-risk keyboard/touch and data recovery regression steps are documented in `docs/FEATURE_ACCEPTANCE_REGRESSION.md`.
- [x] Focused tests cover validation, exact-cent finance and Studio calculations, dates/timezones/DST, deduplication, privacy-aware search, statement preview, and failed persistence.
- [x] README navigation/type counts and product claims are reconciled with the source inventory.
- [x] Full automated suite and release-claim review are complete for this feature slice. Security redesign, visual/device acceptance, and broader automation remain later phases.

## Phase 2 — Security and privacy

- [ ] Inventory data classes, storage paths, sensitive views, backups, logs, and threat boundaries.
- [ ] Design main-record protection and key recovery with vetted security components; do not call encrypted backups at-rest encryption.
- [ ] Provision isolated staging only after plan, cost, and data terms are reviewed; implement and verify owner-scoped authorization/RLS.
- [ ] Add private attachment storage, safe type/size handling, previews, owner checks, deletion cleanup, and backup manifests.
- [ ] Test anonymous/other-account denial, session revocation, import/XSS, malicious files, quota/network failure, conflict retention, export/restore, and migration rollback using synthetic data.
- [ ] Confirm secrets are absent from bundles/logs, destructive actions are recoverable or clearly irreversible, and opt-in integration permissions can be revoked.
- [ ] Complete a written security review and pass staging acceptance before considering production approval.

## Phase 3 — Visual system and accessibility

- [ ] Reconcile navigation and surface naming to the selected hybrid visual direction.
- [ ] Add the Bible's requested theme/density/accessibility settings, including high contrast, larger type, reduced motion, and saved layouts where feasible.
- [ ] Polish responsive layouts at narrow phone, tablet, and desktop sizes; maintain touch targets, visible focus, screen-reader labels, and zoom.
- [ ] Complete keyboard-only and screen-reader journeys, contrast review, motion/power checks, and visual QA on real devices.
- [ ] Keep decorative rooms optional and ensure the plain dashboard remains immediately available.

## Phase 4 — Broader automation

- [ ] Extend the existing local Atelier into the event-envelope/rule-run contract: record-created/updated, status/date, review, import, inventory, and budget triggers.
- [ ] Add validated condition trees and internal actions for linking, checklists, digests, reminders, projections, tags, and staged calendar events.
- [ ] Implement per-action permissions, pause-all, idempotency, loop protection, bounded retry/failure states, undo where possible, and human-readable audit history.
- [ ] Add the Bible's opt-in templates after their domain workflows are complete; sensitive and financial effects remain suggestion-only unless explicitly reviewed.
- [ ] Keep browser-only schedules labeled app-open; add server scheduling only after cost/quota, authorization, and failure behavior are verified.
- [ ] Test replay, dedupe, loop prevention, quiet hours/timezones, failure recovery, approvals, and disable/disconnect behavior.

## Final release gate

No release is complete until feature acceptance, security review, visual/accessibility acceptance, automation tests, backup/restore drill, staging validation, documented cost limits, and explicit production approval all pass. A merged development change alone is not release acceptance.

## Phase 1 implementation log

### Slice 1 — Shared capture, inbox and search — 2026-10-24

- Universal Heart now captures the selected supported type, title, optional body/date, labels, and sensitivity choice. It routes the record to the inbox and does not invent a date for an undated thought.
- Inbox now has Needs Sorting, Sorted, and Archived views, keyword filtering, multi-select sorting/archive, and individual conversion of notes/ideas to tasks. Archive is reversible by changing the view and state.
- Global search now supports text, type, date range, and exact label filters. Sensitive records stay excluded until titles are explicitly included; private bodies and labels remain unsearchable.
- Search presets can be named, saved, reapplied, and removed; they preserve an explicit private-title opt-in and are included in validated workspace backups.
- Quick expense capture creates an expense placeholder with amount zero and clearly prompts the user to enter the amount when sorting it; it does not represent that amount as received/spent until edited.
- Verification: focused engine/UI tests passed; full suite `npm test` 141/141; syntax checks and `git diff --check` passed; `npm audit --omit=dev` reports zero known vulnerabilities.
- Follow-up work from this slice (bulk labels, snooze/undo, conversions, recent places and module scopes) is completed in Slice 5 below.

### Slice 2 — Tasks and tiny steps — 2026-10-24

- Task records now capture a next physical action, blocker, and work context.
- Tasks can have linked child tasks, display progress through those steps, and keep child items out of the top-level board while the parent exists. Orphaned children resurface if a parent is removed.
- Opening a new editor preserves preset fields and uses a distinct draft key for seeded records, preventing subtask relationship data from being lost or sharing another new-task draft.
- Focused UI regression confirms child linkage, completion progress, and physical-action/blocker display. Dependency gating, location, and due-date flexibility remain open.

### Slice 3 — Money scenario planning — 2026-10-24

- Added a money-scenario route for user-entered monthly income, current cash, one-time move costs, and recurring cost categories.
- Calculations use integer cents, show the monthly remainder and months-to-goal at the chosen savings amount, and compare 1/3/6/12-month outcomes after the one-time costs.
- The page states assumptions and does not estimate taxes, verify income, or assume money has been received. Scenarios can be saved as dated records.
- Focused engine/UI tests pass. The rest of the finance lab (accounts, statement import/reconciliation, envelopes, subscriptions, and broader scenarios) remains open.

### Slice 4 — Career interview preparation — 2026-10-24

- Added an application-linked interview preparation form for role questions, evidence from the user's own experience, questions to ask, reflection, interview date/outcome, and a follow-up draft.
- Preparation entries save as sensitive Career notes linked to the application. Draft follow-ups remain local and unsent.
- Validation rejects inactive applications, unsupported outcomes, malformed dates, and oversized fields.
- Preparation records are marked sensitive, hidden from global search text previews by default, and retained locally; no message is sent.
- Verification: full suite passes 148/148; `npm audit --omit=dev` reports zero vulnerabilities; syntax and whitespace checks pass.
- Remaining Career work: resume/portfolio version inventory, sources and contacts, follow-up task workflow, and transparent compensation comparisons.


### Slice 5 — Capture and continuity — 2026-10-24

- Inbox now supports bulk label add/remove/replace, date-based snooze with due-date return, one-step undo for inbox changes, and linked conversion to tasks, projects, events, expenses, or memories. Expense conversion requires an entered amount. Conversion undo soft-deletes the derived record and restores the source.
- Search supports module scopes and saves the selected scope with its reusable filter. The search page shows the last eight visited module routes; this navigation history stays in local browser storage and stores no search terms.
- Added user-owned collections, reusable non-sensitive record templates, validated custom fields in record editors, bidirectional related-page views, and a browsable graph that omits sensitive records.
- Added exact-title duplicate suggestions for non-sensitive records. The user can keep both after review or merge matching text, labels, and links; merged-away records remain recoverable in Trash.
- Journal and diary now have guided writing starts, notebook and month filters, in-room passage search, markdown export, and print. Existing revision history remains available in the editor.
- Future Museum now supports sensitive Future Self letters with a selected reveal date, manual in-app opening when due, annual review, and year-in-moments records linked to their source entries. Reveal is offered when the user opens the page; no background notification is claimed.
- README navigation count updated to 45. Full verification: 164/164 tests pass; syntax/whitespace checks pass; production dependency audit reports zero vulnerabilities. The larger route-level acceptance checklist remains.


### Slice 6 — Import provenance review — 2026-10-24

- Backup import now previews new, identical, and conflicting IDs before writes. Conflict titles are hidden for sensitive records. The user explicitly approves importing new pages while preserving all current conflict versions; the default engine policy still aborts unresolved conflicts.
- Added bounded import history with source filename, backup date, added/identical/conflict record IDs, plus per-record source provenance. Reimporting the same backup remains idempotent. Full restore stays a distinct explicit replacement flow.
- Verification: core and UI tests cover conflict preview, sensitive-title masking, preserved local data, provenance history, idempotency, and the unchanged full-restore confirmation flow.

### Slice 7 — Planning workflows — 2026-10-24

- Tasks now support location, flexible due windows (fixed, before, date range, or someday), prerequisite links, cycle/reference validation, and completion gating until prerequisites are complete.
- Calendar planning provides day/week/month ranges and a selectable timezone. Timed events preserve timezone and local end time through ICS preview/import/export; overlap review compares actual instants across timezones. DST gaps are rejected, repeated local times require an explicit earlier/later choice, and event writes remain user-approved.
- Recurrence supports daily, selected weekdays, and monthly rules with interval, timezone, local time/fold, pause/resume, skip-once, and explicit occurrence approval. Duplicate approvals are bounded and idempotent.
- Habit templates define target days and weekly frequency. Daily logs count once, and pause/resume preserves the existing history.
- Weekly reset surfaces due work and capacity shortfalls; minimum-day planning selects only ready tasks and asks the user to choose priorities rather than silently rescheduling the rest.
- Focus now links a ready task, offers timer pause/reset and a bounded break flow, optional local completion sound, distraction parking, and bounded linked session history.
- Goals support parent/child hierarchy, qualitative progress, editable milestones, linked tasks, and a preview plus explicit approval before a dream creates linked tasks.
- Verification: full `npm test` 183/183; `node --check` for changed modules and `git diff --check` pass; production dependency audit is recorded with the merge verification. Personal Operations and Phase 1 acceptance remain open.

### Slice 8 — Studio, Finance, Home, and route acceptance — 2026-10-24

- Studio now separates exact-cent quotes, invoices, scheduled payment expectations, and received Studio cash. Client approval is required to start delivery; milestone plans are capped at the accepted scope. Change requests, deliverables, outreach history, launch QA, and explicit payment receipt are linked to the project. Business/payment records are private by default.
- Finance adds manual balance snapshots, confirmed/expected income, envelopes, bills/subscriptions, sinking funds and contributions, affordability/cashflow projections, and CSV statement review with duplicate detection. Paying a bill is an explicit ledger record and never initiates a payment. Sensitive money records are private by default.
- Home/admin adds apartment comparisons from entered data, a move timeline that writes tasks only after approval, inventory and warranty review, maintenance recurrence, errands/renewals, and editable document checklists.
- Route acceptance now renders every route empty, checks native named controls and literal action handlers, edits all typed records while preserving privacy classification, verifies export and trash/restore, simulates a failed save without losing the draft, and exercises Studio/Finance/Home approval paths.
- Added a keyboard/touch and high-risk manual regression procedure. Actual browser/device and screen-reader validation remains in the later visual/accessibility phase.
- README inventory reports 46 routes and 70 typed record forms. `npm test` passed 211/211 after PR #23 merged; changed-module syntax checks and `git diff --check` pass. This is a development milestone, not a production release.


### Slice 9 — Career, personal care and statement reconciliation — 2026-10-24

- Career now includes application-specific interview prep, private typed resume/portfolio/work-sample versions, private source and contact records, and one idempotent follow-up task per due application. Nothing is sent.
- The compensation worksheet compares two user-entered offers using annual gross pay and effective gross pay per working hour. It surfaces paid/unpaid weeks and keeps benefits as context rather than assigning guessed dollar values.
- Care, relationships, pets, experiences, Grimoire, and Dream Estate already had route-level implementations in the main source. The acceptance review confirms the encrypted local care vault, opt-in in-app occasions, pet schedules, visited/wished ledger, manual media source/progress, custom/manual/reversed tarot entries, symbol search, keyboard route map, and plain-dashboard escape.
- Statement review now suggests exact-amount/direction candidates within a configurable bounded posting-date window. Unique likely matches can be explicitly reconciled; ambiguous rows stay unchecked; unmatched selected rows are imported and marked reconciled. This is manual CSV reconciliation, not a live bank connection.
- Verification: career helpers and statement reconciliation engines have focused tests; Career and statement flows have UI acceptance coverage. Verification: full `npm test` passed 215/215; 46 routes and 74 typed record forms are generated from the current catalog. Changed modules pass `node --check` and `git diff --check`.


### Slice 10 — Automation, approvals, reminders, work and income — 2026-10-24

- Added versioned and additive workflow contracts for shifts, pay statements, Studio leads, outreach, clients, proposals, and invoices. Older records are migrated without inventing confirmed shifts, actual earnings, verified contacts, or sent outreach.
- Automation rules now include record-created, record-updated, true status-change, date-arrived, and scheduled-review triggers. Local runs deduplicate proposals, avoid feedback loops from automation-created records, honor pause-all, per-rule caps, quiet hours, bounded retries, and readable execution history.
- Added a central Approval Inbox for automation proposals with edit, approve, snooze, dismiss, undo, and retry paths. Browser reminder preferences now include lead time and quiet hours in the saved calendar timezone; delivery remains opt-in and app-open only.
- Work operations now capture shift timing/breaks, commute and preparation, separate estimated wages from actual wage/tip statement details, and add income to Personal finance only when net pay is confirmed received. Studio prospect management adds score, website deduplication, contact holds, and idempotent private follow-up task drafts; it sends no outreach.
- External provider OAuth, live task/calendar synchronization, closed-app push delivery, and a server-side automation worker remain unavailable until credentials, backend services, and provider authorization are configured. Manual ICS remains review-first.
- Verification: full `npm test` passed 232/232. This is a development review build, not a production release.


### Slice 11 — Everyday administration and travel planning — 2026-10-24

- Everyday administration connects dated meal plans and ingredients to grocery records, low-stock supplies, confirmed caregiving coverage, healthcare/dental preparation and follow-up, renewals/paperwork, pet restocks, and transportation fallback plans. Dated next actions become linked tasks; confirmed coverage and saved travel buffers are visible to Day Director as fixed commitments.
- Added travel drafts for a European Christmas market tour, Japan, China, and Indonesia. Dates and budgets start blank; category budgets use exact cents and link to Treasury savings funds. User-entered savings, dates, and spending determine progress—no destination costs are invented.
- Astrocartography activity prompts require a user-entered planet line and location. The app presents reflective activity ideas and can save chosen ideas as editable itinerary tasks; it does not calculate a chart, predict outcomes, book travel, or fetch prices.
- New typed meal and grocery records migrate additively, retain private classification, validate bounded fields and real calendar dates, and expose edit/delete/export routes. Regression coverage exercises grocery/restock lifecycle, linked Day Director tasks and commitments, trip budgets/funds, prompt review, and invalid input.
- README inventory reports 47 routes and 76 typed record forms. Full `npm test` passes 243/243; changed-module syntax checks and `git diff --check` pass. This is a development review build, not a production release.
