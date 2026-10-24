# DreamHub 3.0 — Executive Life Engine & A. Halliwell Studio Operations
Status: newly proposed scope for review, 2026-10-22. SPECIFICATION ONLY, no runtime features implemented. Complements DREAMHUB_3_MASTER_ARCHITECTURE_AND_AUDIT.md.

## North star
User is CEO, app is consent-based chief of staff. Convert strategic priorities into executable daily sequences with realistic time/energy/financial constraints. Never remove user's autonomy; snooze, skip, override, emergency pause, rest and manual reschedule must always work. The system recommends; user authorizes external outreach, purchases, bookings, messages and shift changes.

## Serving job / employment operations
- Shift roster: employer, role, location, confirmed vs tentative shift, start/end, timezone, breaks, uniform, transit mode, expected commute, buffer, check-in instructions, shift trade requests, availability, days off.
- Shift preparation: meals, hydration, uniform, laundry status, work bag, charging phone, transit/departure reminders, post-shift recovery and sleep buffer.
- Earnings: hours, base pay, cash/card tips, tip-out, gross estimate, withholding estimate, actual payout, deposit date, pay period, payroll reconciliation; NEVER conflate expected tips with spendable funds. Track actual wages only with user consent and avoid storing employer credentials.
- Serving shift is fixed constraint. Studio work, Academy and social plans flex around it; never schedule a cold call while on shift.
- Unknown shift schedule stays unknown; do not assume employer, shift times or wage.

## A. Halliwell Studio operating departments
1. CEO dashboard: quarterly/monthly/weekly targets, cash collected vs proposals vs pipeline, capacity, lead funnel, bottlenecks, delivery obligations.
2. Prospect research: source URL, owner verification, service niche, geography, revenue-fit evidence, actual observed problem, fit score, reason, estimated deal size, contact verification, last verified date, duplicate key. Respect prior qualification threshold of 7/10 unless changed.
3. Acquisition CRM: sourced → verified → qualified → ready for contact → contacted → replied → discovery → proposal → negotiation → won/lost/nurture; independent per-contact channel and consent/suppression flags.
4. Cold calling: call blocks based on prospect local business hours, phone verified, personalized opener, objections, outcome, notes, next step and follow-up date; comply with applicable telemarketing/do-not-call and recording laws; never auto-dial without appropriate permissions/compliance.
5. Cold email: validated address, deliverability safeguards, personalization, draft/approve/send, bounce handling, unsubscribe/suppression, reply classification, follow-up and dedupe; comply with CAN-SPAM and applicable laws. No unsolicited mass sending by default.
6. Follow-up queue: explicit Day 7 / Day 15 as latest stated preference; configurable, stop on reply/opt-out/bounce, channel-specific contact history and quiet hours, never duplicate.
7. Proposal & sales: offer catalog, scope, fixed vs custom price, discovery notes, proposal, approval, agreement, payment milestones, client onboarding and closeout.
8. Client delivery: deliverables, project milestones, revisions, files, approvals, deadlines, scope changes, QA, accessibility, handover, invoices and collections.
9. Product shop: templates, licenses, inventory/version, product pages, marketplace fees, customer onboarding and support, profitability.
10. Marketing: LinkedIn/IG/Pinterest/content ideas, drafts, approvals, publishing calendar, performance attribution.
11. Operations: bookkeeping, tax reserve estimates, subscriptions, contractor management, business compliance, legal documents, renewal calendar.
12. Learning integration: weaknesses from sales/coding/client delivery generate optional Belle Academy practice; course projects may become portfolio artifacts only after review and consent.

## Daily studio acquisition assembly line
- Lead sourcing and qualification block → data quality check/dedupe → prioritize 7/10+ → personalized call/email preparation → human-reviewed outreach → log call/email outcome → follow-up scheduling → proposal and delivery queue.
- Day Director separates lead research, call windows, email drafting, reply handling, follow-ups, and client delivery into independent time blocks; timebox with realistic daily capacity.
- Use local-time windows and relevant business hours; schedule follow-ups around serving shifts; avoid overwhelming users with quotas unsupported by conversion data.
- Daily planning inputs: confirmed shift roster, obligations, energy, deadlines, outstanding follow-ups, studio pipeline, academy workload, commute and money guardrails.
- Revenue reporting: leads researched, verified, qualified, calls attempted/connected, emails sent/delivered, replies, qualified conversations, proposals, wins, collected revenue; denominators, date ranges, and channel attribution visible. Never count proposal value as cash.
- For follow-up Day 7 and Day 15, treat as suggested cadence subject to suppression and contextual suitability; no sending without explicit authorization.
- No fabricated owner names, emails, phone numbers, lead scores, contact history or performance metrics.

## Scheduling / Day Director decision logic
1. Fixed anchors: confirmed work shifts, appointments, deadlines, and protected sleep/recovery.
2. Obligations: payments, client commitments, required follow-ups, transport, meals, personal care.
3. Income generation: sales conversations, proposal delivery, paid client work, strategic prospect research.
4. Belle Academy: 10–14 hours/week, default 12; can redistribute/enter maintenance mode in high-work weeks without penalizing user.
5. Wellness, home, relationships and experiences: protected realistic slots, free-first.
6. Planning capacity: user-defined wake/sleep, travel time, transitions, preparation, energy, task estimates, uncertainty buffer, time zones.
7. Conflicts: propose choices, explain what is displaced, seek approval before moving commitments. Never silently cancel shifts, send outreach or spend money.
8. End of day: confirm completed tasks, shift earnings, sales outcomes, next-day readiness, and optional reflection.
9. Weekly CEO meeting: review lead funnel, outreach conversion, collected revenue, client deadlines, available studio hours, Academy progress, spending and social opportunities.
10. Monthly review: studio P&L, payroll, income stability, pipeline forecast, academy examinations, relationships, life experiences, progress to long-term goals.

## Missing grown-adult departments to audit
- Employment payroll, taxes, work benefits, sick days and labor documentation.
- Food/meal preparation, groceries, hydration, workday nutrition, transport contingency.
- - Administrative renewals, legal obligations, mail and important paperwork.
- Time for friends, dating if desired, celebrations, boundaries and recovery.
- Preventive healthcare, dental, pet care and recurring supplies.
- Financial separation of personal and studio, emergency fund, tax planning and future housing/car.
- Rest, recreation, downtime and unstructured creative life; no productivity score for human worth.

## Data model / audit requirements
- Types: employment, shift, earningsEntry, payPeriod, commutePlan, lead, leadSource, contactMethod, outreachAttempt, callLog, emailLog, followup, suppression, proposal, contract, projectMilestone, invoice, payment, product, marketingCampaign, scheduleBlock, scheduleDecision, energyCheckin, review.
- Every record has stable ID, owner, provenance, timestamps, timezone as relevant, privacy classification, status, relationships, audit trail. Sensitive customer/contact and payroll data should not be committed to public GitHub.
- Shift → commute → wardrobe → meal → earnings → personal budget.
- Lead → qualification → channel outreach → follow-up → conversation → proposal → contract → project → invoice → received cash → business finance.
- Studio pipeline → next best action → approved calendar block → completion → analytics.
- Studio skill gap → Academy lesson/assignment → assessed skill → portfolio evidence.
- Personal calendar + shift roster + Academy + studio + wellness + experiences → one conflict-aware daily plan.
- Automated reminders only with an implemented scheduler, permissions and opt-in. A static page cannot guarantee push notifications or background execution.
- Testing: cross-domain referential integrity, timezone/DST, duplicate suppression, unsubscribe/opt-out, no phantom cash, missed shifts, double-booking, private data exposure, offline state, migrations, backups, keyboard and mobile flows.
- Acceptance: user can enter an actual serving roster, receive prep/departure prompts, track earned vs pending pay, plan approved outreach blocks, log calls/emails and follow-ups, see qualified leads and proposals, finish assignments, and review accurate cash and time without duplicates.

## Next engineering sequence
A. Verify current branch modules and open PR #8; do not merge blindly.
B. Design versioned schemas for shift, outreach, academy and finances and test migrations.
C. Implement Day Director scheduling as pure testable recommendation logic, then UI and user approvals.
D. Implement Studio CRM/acquisition and serving shift operations, then connect calendar, finances, Academy and wardrobe.
E. Test end-to-end with realistic synthetic data; security/privacy and compliance review.
F. Deploy only after explicit release decision.
