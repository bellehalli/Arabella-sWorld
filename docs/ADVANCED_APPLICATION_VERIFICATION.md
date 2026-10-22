# Advanced application verification register — DreamHub
Updated 2026-10-22. This register is an evidence checklist, not a certification.
Production and the existing Supabase project are out of scope. Private attachment staging is deferred by owner.

## Shared verification contract (EVERY application)
- [ ] Opens on desktop and mobile without errors; keyboard navigation, accessible labels and reduced motion
- [ ] Create, read, edit, delete/archive, restore and search each supported entity
- [ ] Form validation, empty/loading/error states, no silent failures
- [ ] Draft recovery, reload persistence, sign-out/sign-in persistence, revision/conflict protection
- [ ] Links to relevant applications are real, idempotent, reversible and privacy-aware
- [ ] Import/export and backup/restore preserve data, references and history
- [ ] No unapproved external action, fabricated live data, or hidden charges
- [ ] Automated unit/integration tests AND manual staging browser evidence

## Application matrix (all pending end-to-end certification)
| Application | Advanced workflow to prove | Evidence needed |
|---|---|---|
| Life Concierge / Today | unified agenda, reminders, deferrals, approval inbox, resets | schedule + action integration |
| Time Garden / Calendar | month/week/day, recurrence, DST, conflicts, event edit | calendar edge-case tests |
| Universal Heart | capture to each destination, edit, approval, undo | cross-workspace tests |
| Belle Academy | 16-week semester, actual lessons, quizzes, graded exams, spaced review, transcript | course-content and assessment tests |
| Wealth Architect | budget, recurring bills, debt, subscriptions, forecasting, protected cash, Studio profit | reconciliation and arithmetic tests |
| Art of Living | all worlds, event provenance, planning, attendance, reflection, museum | multi-stage journey tests |
| Wellness & Care | routines, appointments, medication/supplement logs if enabled, privacy | sensitive-data tests |
| Beauty / Personal Care | product library, regimen, schedules, shopping approval | persistence and cross-link tests |
| Home & Sanctuary | maintenance, inventory, documents, errands, pet care | lifecycle tests |
| Clueless Closet / Wardrobe | garment inventory, outfits, actual wear tracking, garment care | wear-cycle tests |
| Mind & Magic | journal, diary, mixed moods, dreams, grimoire, tarot | privacy + editor tests |
| Career & Applications | application → interview → offer/rejection, follow-ups | pipeline transitions |
| A. Halliwell Studio | lead → proposal → client → milestones → invoice → payment | pipeline + money links |
| Social & Relationships | people, dates, consent, reconnection, invitations | contact privacy tests |
| Memories & Identity | experience history, artifacts, search, linked reflections | attachment + retrieval tests |
| Travel & Adventures | planning, costs, itineraries, schedule links | budget and schedule tests |
| Focus / Habits / Goals | timer, sessions, trackers, targets, progress, completion | time and recurrence tests |
| Brain Engine / Automations | recommendations, review, approvals, duplicate prevention | safety and idempotency tests |

## Known blockers
1. Private attachment storage requires isolated Supabase staging; deliberately postponed.
2. Latest passing CI confirms existing automated tests only, not advanced feature completeness.
3. Legacy and DreamHub 3.0 application paths coexist; consolidation and full wiring remain unverified.
4. Third-party OAuth integrations and real external actions must not be presented as live without verified authorization.
5. No production merge, deployment, migration or real-user data migration until separate approval.

## Test execution order
A. Inventory routes, entry points, controls and persisted record types.
B. Run automated tests; map each test to application workflows, mark uncovered paths.
C. Add regression tests for missing advanced flows, repair failing logic in the feature branch.
D. Exercise integration across calendar, money, academy, studio and personal worlds.
E. Staging browser testing with synthetic data and separate owner/test account when available.
F. User acceptance review; only then discuss production readiness.

## Master Bible v5 compliance gate — mandatory
Source of truth: `DreamHub_Master_Bible_COMPLETE_v5(1).pdf` (user-provided, 68 pages). Existing architecture docs are supporting references, not substitutes.

For EACH route, application, shared service and integration:
1. Extract each applicable Bible requirement with page number and stable ID (BIBLE-<page>-<ordinal>).
2. Map requirement to UI route, source module, data entity, test and observed evidence.
3. Assign one of PASS (tested), PARTIAL (some behaviors proven), FAIL (verified broken), MISSING (not implemented), BLOCKED (requires isolated environment/provider), or NOT APPLICABLE (justified).
4. Record the exact discrepancy, severity (critical/high/medium/low), repair ticket, and regression test.
5. Rerun functional, privacy, accessibility, offline and recovery checks after fixes.
6. Application is certified ONLY when every applicable requirement is PASS, or an explicit owner-approved exception is documented. No inference from presence of code or green CI.

### Bible v5 launch-wide mandatory gates
| Bible requirement | Evidence | Current status |
|---|---|---|
| Capture on one device, locate on another without loss/duplicates | real two-device scenario | BLOCKED |
| Save offline journal with truthful pending-sync and conflict protection | offline/reconnect browser test | MISSING / UNVERIFIED |
| Complete task and goal workflows without external integrations | create→complete→restore test | PARTIAL |
| Export/import JSON/CSV and media manifests with sample restore | checksum + actual restoration drill | PARTIAL |
| Anonymous and different authenticated user cannot access private records/files | RLS and direct API test | BLOCKED |
| Every automation can be previewed, inspected, disabled, with last-run result | per-rule UI tests | PARTIAL |
| No unapproved external sends, purchases, publishing or changes | negative action tests | PARTIAL |
| Keyboard/mobile/assistive-tech/reduced-motion usability | real browser audits | BLOCKED |
| Outage does not prevent promised offline manual features | simulated outage test | MISSING / UNVERIFIED |
| $0-extra recurring cost guardrails and usage caps | quota/off-switch tests | PARTIAL |
| Cross-module integrity and idempotent linking | scenario integration tests | PARTIAL |
| Backup restore, rollback path and no data loss | recovery drill | BLOCKED |

### Evidence table format
| Bible ID/page | Requirement | Route | Code | Test | Result | Severity | Fix |
|---|---|---|---|---|---|---|---|
| To populate from complete PDF | Exact testable criterion | Route | Module | Test name/run | Pending | Pending | Pending |

Do not declare any department, Step 1, or the overall site Bible-compliant while mandatory requirements are missing, blocked or untested. Deferred private attachment staging remains BLOCKED, not PASS.

## Beyond-the-Bible capability review (aspirational; NOT a new launch blocker without approval)
After each requirement-level Bible audit, ask: Is this the strongest safe, maintainable, free-first version of this workflow? Evaluate:
- Depth: can the user finish the actual real-life outcome end to end, not just store a record?
- Intelligence: does it surface useful, explainable next actions based on user-controlled information, without pretending to know unknown facts?
- Interoperability: are links across calendar, money, Academy, Studio, home and memories correct, reversible, permissioned and deduplicated?
- Resilience: offline behavior, concurrent edits, audit history, migration, backups and recoverability.
- Privacy and control: sensitive-data minimization, consent, transparent automation, no surprise actions.
- Accessibility and performance: mobile-first, keyboard/screen-reader, reduced motion, fast under realistic data volumes.
- Ownership and cost: local/manual alternatives, data portability, $0-extra recurring goal, no unapproved dependencies.

Score each dimension with tested evidence, not an invented composite score. Capture each improvement as PROPOSED / APPROVED / IMPLEMENTED / VERIFIED, with benefit, complexity, risk, cost and prerequisite. Prioritize missing Bible requirements and correctness/security defects over aspirational features. Avoid feature bloat and do not change product scope without owner approval.
