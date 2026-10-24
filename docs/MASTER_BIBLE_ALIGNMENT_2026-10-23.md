# Master Bible alignment check — October 23, 2026

Scope: read-only comparison of the repository's default `main` source and project notes against **DreamHub Master Bible v5**, followed by one local, reversible code change on `codex/bible-alignment-2026-10-23`. No provider, hosting, production, billing, or user-data settings were changed.

## Current alignment

| Bible area | Current state | Evidence / next gate |
|---|---|---|
| Manual-first product and visual direction | Broadly implemented | 42 navigation routes and 48 typed record forms in this branch, three modes, theme options, reduced-motion support, and no paid AI or bank connection in this milestone. |
| Core life modules | Broadly represented, with varying depth | Journaling, mixed moods, grimoire, tasks, money, career, studio, home, wellness/beauty, wardrobe, relationships, pets, travel, and memories exist in the review build. Several advanced systems remain outside the milestone. |
| Belle Academy | Upgraded in this branch; curriculum depth remains in progress | The Academy now creates a dated 16-week map with five courses, 80 weekly learning plans, 80 assignments and 20 assessments, within the defined 12-hour weekly allocation. It supports diagnostics, evidence-based 80% mastery, score capture, a clearly provisional transcript, source provenance, and spaced English vocabulary reviews. The content is an editable learning scaffold, not a complete faculty-authored course, official credential, or verified reading library. |
| Ten “10x systems” named in §5 | Implemented in this branch; local verification only | Added working Life Timeline with text/date/category/privacy search, Personal Seasons, Decision Observatory, Energy Economics, Opportunity Vault, Sunday Salon, structured Personal Policies, Micro-Adventures Generator, Future Museum, and Gentle Recovery Room flows. They are manual-first and local to the existing record store. Decisions stay with the user, adventures use saved ideas, Future Museum copies selected goals/wishes/seasons into dated snapshots, and recovery excludes sensitive records. |
| Automation Atelier / E11 Automation Cockpit | Expanded local approval-based tier; scheduled and connected tiers remain out of scope | Seven local triggers, three user-approved local action types, optional AND/OR conditions, timezone-aware quiet hours, per-rule daily caps, sensitive-record exclusion, dry-run traces, and idempotent decision history. No background schedule or outside action runs. |
| Data portability | Partial; improved in this branch | Existing readable JSON/CSV/Markdown/ICS exports and merge import remain. This branch adds encrypted full-state backup and explicit replacement restore with schema validation and persistence-failure safety tests. |
| Privacy and security | Release blocker | Main workspace data and drafts remain plaintext in browser storage. Only the separate care vault is encrypted at rest. A concealed search preview is not access control. |
| Identity, authorization, cross-device sync | Not verified | Supabase adapter and owner-scoped SQL migration exist, but there is no configured staging project, applied migration, real owner/second-account RLS test, or verified two-device sync. |
| Offline reliability and reminders | Partial | Draft persistence and local reminders while the app is open exist. Policy review reminders are opt-in. There is no tested offline sync queue or guaranteed closed-browser delivery. |
| Accessibility and device acceptance | Source support exists; acceptance is pending | Skip link, visible focus styling, reduced-motion support, and touch-oriented layout exist. Live keyboard, screen-reader, mobile, contrast, and visual acceptance checks remain outstanding. |
| Automated validation | Passing in local worktree | Current branch: 138/138 tests. `npm audit --omit=dev` found 0 known production dependency vulnerabilities. Tests are unit and simulated-DOM tests, not real browser, database, or deployment acceptance. |

## Change made in this branch

- Added encrypted full-app backup export using the existing Web Crypto AES-GCM/PBKDF2 helper.
- Added encrypted backup import that validates the full DreamHub schema before prompting to replace current data.
- Kept readable JSON export and safe, conflict-stopping merge import available.
- Added tests for plaintext exclusion, exact state round-trip, wrong passphrases, tampering, foreign vault files, invalid backups, and failed persistence.

## In-app feature increment — October 24, 2026

- Added an editable, 16-week Belle Academy semester generator. Course load is 12 hours/week across CS201, BUS201, FND101, SPA101, and RES101; assignments and checkpoint exams count inside each course's weekly time budget. Generation is idempotent by semester start date and does not create calendar events.
- Added a weekly study planner that spreads outstanding course work across chosen days, checks timed events and shifts, respects daily focus caps and between-block buffers, reports work that cannot fit, and only writes planner events after explicit approval. It does not write to Google Calendar.
- Added per-course diagnostics, learning-evidence capture with an 80% mastery rule, graded assignment/exam evidence, and a transcript view that labels incomplete grade coverage as provisional instead of filling missing categories with invented marks.
- Added a research notebook requiring source title and URL, preserving access date, method, limits, and learner synthesis. The UI does not claim novelty or faculty review.
- Added a 5-foundational/15-advanced vocabulary intake and spaced recall with due dates and recall confidence. New words begin unmastered.
- Added deterministic engine and simulated-UI coverage for term generation, weekly effort accounting, diagnostics, mastery, research provenance, recall progression, and grade coverage.
- Implemented the ten §5 advanced systems: private-title-aware dated timeline filters; active season and season archive; weighted decision matrix with no automatic winner; feasible task shortlist by available energy and minutes; user-weighted opportunity comparisons; factual, dated Sunday Salon summaries; user-authored personal policies; constraint-based draw from saved micro-adventure ideas; explicit dated Future Museum copies; and a capped, neutral recovery digest.
- Added deterministic engine tests and simulated-UI coverage for decision saves, energy check-ins, opportunity scoring, snapshot copying, and the new routes. Sensitive records are omitted from timeline by default, Sunday Salon aggregation, recovery, and snapshots; the timeline requires an explicit toggle to reveal private titles.
- Closed audit gaps in the in-app feature set: removed a duplicate encrypted-export handler, added timeline text search (private body and tags are never searchable), added structured per-purchase/weekly/monthly money guardrails and explicitly opted-in review reminders, and expanded Automation Atelier with seven triggers, three actions, AND/OR conditions, quiet hours and dry-run audit traces.
- Spending rules are advisory: an over-limit expense prompts the user, who can edit or continue; no transaction is blocked and no money is moved. Policy reminders require opt-in and the app's separate browser-notification permission.
- Automation suggestions remain local and individually approved. Approvals create a linked task, reflection page or inbox note; preview traces create no life record. External actions and unattended schedules are not enabled.
- Current local validation after this increment: `npm test` 138/138; syntax checks and `git diff --check` pass; production dependency audit reports 0 vulnerabilities. Live browser, database, device, and staging acceptance remain deferred.

## Gates still requiring an isolated environment or further security review

1. Design and review main-record encryption and key recovery before migration; do not treat encrypted backups as encryption of localStorage.
2. Provision approved staging infrastructure only after cost and data-term review; apply the migration there and test anonymous, owner, and second-account access to every table and RPC.
3. Verify sign-in, session expiry/revocation, deployment access protection, and fail-closed behavior from logged-out browsers.
4. Run real cross-device save/conflict, export/restore, quota/network failure, offline, and migration tests with synthetic data.
5. Complete mobile, keyboard, screen-reader, contrast, reduced-motion, XSS/import, dependency, and backup-recovery acceptance.
6. Update this status only after each gate has evidence; production remains outside this work branch.
