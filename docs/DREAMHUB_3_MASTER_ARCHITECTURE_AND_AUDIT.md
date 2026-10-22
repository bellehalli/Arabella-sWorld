# DreamHub 3.0 — Master Architecture & Integration Audit
Status: APPROVED PRODUCT BLUEPRINT; audit based on inspected dreamhub-v2 source and open PR #8. **Do not mistake planned features for working features.** Date: 2026-10-22.
Repository: bellehalli/Arabella-sWorld. Integration branch: dreamhub-v2. This specification branch is documentation-only; do not deploy or merge automatically.

## Product contract
Arabella's World is a magical, private, proactive life operating system: practical dashboard connected to immersive floral/pink/lavender editorial magical environments. Highly proactive Life Concierge recommends actions and experiences, but purchases, bookings, communications, sharing and consequential changes require explicit approval. Mobile-first, accessible, keyboard operable, reduced-motion support. Free-first and necessities-first. No shame/streak punishments. User's personal details must not be hardcoded into this public repository.

## Ten connected departments
1. Life Concierge: agenda, calendar, tasks, routines, reminders, intelligent deferrals, approval inbox, morning briefing, optional evening reset, weekly and monthly planning.
2. Belle Academy: Fundamentals Institute, University, Language School, Research & Thesis Institute, transcript/portfolio, syllabus, coursework, adaptive diagnostics, spaced repetition, assessments and academic integrity.
3. Wealth Architect: budgets, bills, debts, subscriptions, cash reserves, spending guardrails, income/expense records, business profitability, $500K/year by October 2030 scenario planning. Clarify personal gross vs business revenue vs take-home before committing milestones; never count unrealized income as available funds.
4. Art of Living: Culture Club, Class Atelier, Social Garden, Solo Date Society, Dining Passport, Intellectual Salon, Hobby Laboratory, Adventure Atlas, Hostess Academy, Personal Refinement Studio, Community & Contribution Garden, Life Museum.
5. Wellness & Care: appointments, preventive care, fitness, sleep, medication/supplements tracking if user chooses, beauty/hair/skin/dental, pet care; confidential by default.
6. Home & Personal Sanctuary: cleaning, laundry, maintenance, documents, transport, groceries, inventory, cybersecurity, moving, Clueless Closet and OOTD wear-cycle.
7. Mind & Magic: journal, diary, multi-select mood check-in, dreams, grimoire, tarot reflections, brain dump, creativity, private reflection.
8. Career & Studio: applications, interviews, portfolio, coding skill growth, A. Halliwell Studio leads, proposals, clients, milestones, revenue, renewals.
9. Social & Relationships: contacts, birthdays, consent, reconnection, classes, invitations, hosting and community.
10. Memories & Identity: experience history, ticket stubs, photos, reading, academic work, wardrobe history, milestones, retrospective.

## Belle Academy — approved Standard Semester
- 16-week semester; 10–14 hours/week; default 12 hours/week (192 hours/semester); workload is **inclusive** of assignments, examinations and research.
- CS 201 Programming & Computational Thinking: 3h/week. JavaScript, data structures, algorithms, debugging, testing, accessibility, architecture; tested capstone.
- BUS 201 Business Economics & Finance: 2h/week. Accounting, unit economics, cash flow, pricing, demand, margins, financial models; evidenced business analysis.
- FND 101 Fundamentals: 2.5h/week. Arithmetic, algebra, percentages, grammar/parts of speech, spelling, vocabulary, diction, written expression, reading comprehension, logic, pattern recognition, memory strategies.
- SPA 101 Elementary Spanish I: 2.5h/week. Beginner/A1-aligned target; pronunciation, listening, speaking, reading, writing, grammar, culture; weekly tests and practical conversations. Achievement based on assessment, not attendance.
- Academic Writing, Research & Assessments: 2h/week. Evidence, argument, essays, APA/other appropriate citations, bibliography, methods, peer-reviewed sources, source verification, oral presentation, capstones.
- English vocabulary: **20 NEW words/week, 5 foundational and 15 more challenging**, diagnostic-adjusted and progressively harder by demonstrated mastery. Definitions, pronunciation, spelling, etymology, context, original writing and spoken use, spaced review. Spanish vocabulary is additional and separate. 320 introduced words per 16-week semester, not a claim of mastery.
- Daily meaningful practice; weekly quizzes and assignment submissions; cumulative exams every four weeks; midterm week 8; final exams and capstone week 16. Formal exams independent and feedback afterward; practice can offer hints.
- Mastery by skill and concept, prerequisite map, error categories, attempts, revisions, long-term retention, feedback with transparent AI limits. Suggested 80% overall mastery plus required essential skills, configurable.
- Research pathway: foundations → 100/200-level → 300/400-level → graduate-style → doctoral-style independent research. Academic levels are per subject, gated by prerequisites and work quality, not by elapsed weeks. Thesis workflow: question → literature review → bibliography → methodology → evidence → draft → feedback → revision → oral defense. Academic integrity, source provenance, privacy, research ethics. Never claim accreditation, degree, verified novelty or faculty review.
- Sample first-semester 4 blocks: weeks 1–4 diagnostics/foundation; 5–8 proficiency/midterms; 9–12 application/research; 13–16 synthesis/capstones/finals.
- Academic content catalog must hold real lesson objectives, readings with legal URLs/licenses, exercises, answer keys, rubrics, assignment deadlines, exams, projects and estimated effort. No fabricated lectures or citations.
- Learning may link to lived experiences (museum → art history reflection, Spanish language exchange → speaking practice, business client project → capstone), but users control whether personal events are shared with coursework.
- Scheduling respects income work, appointments, rest and energy; deferral and lighter maintenance mode avoid punitive backlogs.

## Wealth Architect — approved goal, unresolved metric
- User ambition: >= $500,000 annual income/revenue by October 2030. **Not yet resolved**: personal gross, business revenue, personal net take-home, or combined income.
- Model separate salary, business revenue, business costs, operating profit, owner compensation, tax reserves, debt, runway, recurring revenue, client acquisition, conversion, retention, capacity and scenario assumptions.
- Four years: (1) stabilize income and validate skill/offers; (2) repeatable profitable delivery; (3) scalable operations and ownership; (4) sustainable annualized high-income execution. No guaranteed projections or invented market metrics.
- Guardrails: cash less known bills, essential spending, committed debt payments and protected reserves = potential discretionary money. Include transit/materials/tax in experience costs. No purchase/book/send without consent.

## Art of Living and maintenance
- Twelve worlds and ten maintenance categories are specified in docs/ART_OF_LIVING_MASTER_PLAN.md on open PR #8. Preserve and integrate after resolving branch divergence.
- Weekly free/affordable adventure, monthly real calendar with verified source/date/cost/registration and transit; distinguish verified live event from evergreen idea/unverified lead.
- Monthly cultural/social/cognitive progress; no arbitrary personal-worth scores. Classes, new restaurants, networking, volunteering, hosting, solo outings, hobbies, travel, intellectual salon and life museum.
- Home maintenance, pet supplies, documents, renewals, digital security, wardrobe OOTD worn vs preview, garment-care and professional-cleaning rules.

## Shared integration contracts
- One stable record ID per entity; typed records; versioned migrations; relation graph; deduplication; provenance; local date + timezone for sessions; DST and recurrence handling.
- Calendar is the source of scheduled commitment truth; recommendation is NOT a booking. Academic enrollment links course → lesson → session → assignment → exam → transcript; related calendar slots are derived/synced with explicit permission and no duplicate records.
- Money is the source of affordability truth; suggested outings/classes must have cost provenance and not spend reserved cash.
- Experience flow: discover → verify → save → approve → schedule → budget → prepare/transport → attend → reflect → archive memory.
- Academic flow: diagnostic → curriculum placement → lesson → practice → assignment → submit → feedback → revise → assess → mastery → portfolio; never mark complete merely for opening a page.
- Career flow: skill gap → academy course → demonstrable project → portfolio → lead/application → interview/proposal → contracted work → invoice → collected revenue → wealth forecast.
- Wardrobe flow: outfit preview → mark actually worn → care decision → laundry/cleaning → garment availability → wear history; no automatic marking of all garments clean.
- Concierge: recommendations include source, rationale, cost, effort, confidence, approval requirement, dismiss/snooze, quiet hours and frequency caps. Never claim autonomous background work without implemented scheduler/integrations.
- Data protection: privacy-by-default; do not commit financial account data, personal medical data, contacts, diary contents, credentials or private academic submissions into public GitHub. Secure optional sync, backup/export/import, recovery and deletion.
- Accessibility: keyboard, focus, semantic markup, contrast, screen readers, reduced motion, mobile responsive, clear errors.

## Evidence-based repository audit (inspected 2026-10-22)
| Area | Evidence | Status | Gap |
|---|---|---|---|
| Base app and navigation | catalog.mjs defines routes, types; app.mjs renders shell | PARTIAL | Ten-department IA and immersive realms need UX work |
| Tasks, calendar, daily concierge | app.mjs home() calls unifiedAgenda; life-integrations.mjs/calendarItems | PARTIAL | No full proactive verified discovery, approvals, intelligent academic scheduling |
| Relationship graph | life-connections.mjs validates record links and blocked items | PARTIAL | Course/session/assessment/experience relationships not modeled |
| Routines | rhythm-engine.mjs imported; home recurrence in app.mjs | PARTIAL | Course recurrence, exam scheduling, review cadence missing |
| Money | catalog.mjs transaction/bill/debt/saving; money-freedom.mjs imported | PARTIAL | No verified Wealth Architect income scenarios, strict affordability engine |
| Wardrobe | wardrobe-cycle.mjs imported; wear transitions | PARTIAL | Verify end-to-end garment care, photos, OOTD and all lifecycle tests |
| Journal, grimoire, moods, dreams | catalog.mjs routes and types | PARTIAL | Depth, accessibility, privacy and links need end-to-end audit |
| Existing learning | catalog.mjs learning is a basic 'Learning resource' record | NOT ACADEMY | No courses, Spanish, exams, mastery, assignment/research system |
| Art of Living | PR #8 adds art-of-living.mjs and dashboard, open and nonmergeable | IN PR / UNMERGED | Rebase carefully, run CI, verify navigation and tests; do not claim delivered |
| Career/studio | catalog.mjs application/client types | PARTIAL | No verified revenue-to-learning-to-finance integrated lifecycle |
| External integrations | cloud.mjs optional Supabase; app.mjs local store | PARTIAL | Security review, live event sources, permissions, calendar and finance integration |
| Tests | package.json node --test tests/*.test.mjs | PARTIAL | Need test coverage and browser end-to-end results; not run by this documentation commit |

### Audit limitations
Only app.mjs, catalog.mjs, life-connections.mjs, life-integrations.mjs, package.json and PR #8's Art of Living plan were inspected in this pass. No complete file tree, local test run, live browser audit, production integration audit, or security penetration test has been performed. **No claim that all systems are connected or functional.** Open PR #8 reports mergeable=false; determine why before integrating.

## Delivery order / acceptance gates
0. Preserve existing data and feature branches; inventory every module, route, data type, tests, PR, cloud integration, deployment settings. Resolve PR #8 divergence; do not merge blindly.
1. Versioned core schema + safe migrations + backup/recovery + integration contracts and tests.
2. Belle Academy domain engine: course catalog, 16-week syllabus, diagnostic, vocabulary cadence, Spanish, assessments, grading, submission/revisions, transcript and research; tests for counts, prerequisite gates, retention, grading and dates.
3. Calendar/rhythm and Concierge integrations: academic time blocks, review scheduling, permissioned recommendations, quiet hours and load balancing.
4. Wealth Architect: budget guardrails, income metric choice, revenue/owner earnings model, evidence-based scenario calculator and approvals.
5. Art of Living + life maintenance + wardrobe end-to-end connected flows and trustworthy event source adapters.
6. Magical visual system, mobile UX, accessibility, performance, offline handling, privacy and browser E2E.
7. Integration matrix signoff: each cross-domain flow above passes automated tests + manual walkthrough, no duplicate records, no unsafe spending or messaging, no data loss.
8. Only after acceptance: single deliberate Vercel production release. GitHub commits/PRs do not themselves mean deployed.

## Definition of done
- Every feature has a traceable spec, implementation, tests, and clear built/planned status.
- User can complete a full first-semester learning journey, including 20 English words/week, Spanish, assignments, monthly exams and portfolio, without duplicate calendar entries.
- Every money-related suggestion respects reserves and explicit approvals.
- Experiences, academics, career and memories share stable links with correct privacy and provenance.
- CI and browser smoke tests pass; migrations and recovery tested; public repo contains no personal secrets.
- Final deployment requires explicit release authorization.
