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
