# DreamHub 3.0 — Phase 1–3 implementation register
Updated 2026-10-22. This is an implementation register, not a claim of launch readiness.

## Phase 1: Shared foundation
- [x] Cohesive Academy / Art of Living / Studio rollups and linked-record summaries (`cohesive-workspaces.mjs`).
- [x] Shared date-indexed Time Garden agenda across records (`time-garden.mjs`).
- [x] Basic overlapping timed-event detection.
- [ ] Consolidate all legacy navigation, record editors and Studio pipeline views.
- [ ] Comprehensive linked-record controls, duplicate merging and data recovery tests.
- [ ] Resolve superseded open PRs #8, #9, #11 without losing any newer work.

## Phase 2: Time Garden
- [x] Custom DreamHub month calendar exists; connected-world overview added.
- [x] Local DreamHub event creation and editing already supported by record editor.
- [x] Cross-world date-indexing and basic conflicts.
- [ ] Day / week drag-and-drop views, time zone and recurrence edge cases.
- [ ] Secure Google OAuth consent and token lifecycle.
- [ ] Google Calendar and Tasks two-way sync, idempotent remote IDs, conflict resolution, deletion handling and background refresh.
- [ ] Production integration tests with authorized test account.
- [ ] No claim of Apple Health or Notes access from a browser.

## Phase 3: Universal Heart + Action Center
- [x] Universal Heart capture screen creates records in private DreamHub store.
- [x] Heart supports task, event, note, journal, expense, contact, lead, assignment and experience plan.
- [x] Recurring proposals now have Approve / Dismiss buttons and persisted decisions.
- [x] Repeated decisions are filtered by stable proposal IDs.
- [ ] General approval inbox for all Concierge proposals and external effects.
- [ ] Edit / reschedule / save for later controls.
- [ ] Cross-workspace automatic effects with reversible audit history.
- [ ] Google/Gmail send, purchase or booking actions remain **unimplemented** and must require explicit approval.

## Security and release
- Never put owner credentials, real private life records, OAuth client secrets or tokens in GitHub.
- Keep cloud authentication fail-closed. Do not turn off Vercel protection for convenience.
- No Google connection is claimed or simulated as active.
- The feature branch must pass CI and review before merging.
- Production Vercel deployment requires a separate explicit decision.
