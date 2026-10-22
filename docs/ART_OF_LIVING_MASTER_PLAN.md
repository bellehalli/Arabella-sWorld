# Arabella's World — The Art of Living + Life Maintenance
Status: Approved product scope. **Specification, not a claim that all features are implemented.**
Principle: manage necessities AND cultivate a cultured, connected, adventurous, independent, expressive life. All goals are adjustable; never shame users for rest, spending constraints, disability, or missed outings.

## 12 Art of Living worlds
1. **Culture Club**: museum/gallery/theater/ballet/opera/jazz/classical concerts/lectures/architecture/historic houses/film/festivals; attendance, notes, artists, works, favorites.
2. **Class Atelier**: class discovery, trial sessions, adult education, schedules, fees, materials, registrations, attendance, skill progress, waitlists.
3. **Social Garden**: meaningful connections, friend interests, check-ins, invitations, birthdays, recurring clubs, networking, boundaries and consent.
4. **Solo Date Society**: low-pressure outings filtered by budget, energy, transit, accessibility, safety, time and mood.
5. **Dining Passport**: cuisines, new restaurants, dish discoveries, reservations, reviews, food culture, tasting notes, dietary preferences, etiquette learning.
6. **Intellectual Salon**: books, lectures, history, art, literature, philosophy, science, economics, languages, curated personal curricula and reflection.
7. **Hobby Laboratory**: experiments, 30-day trials, supplies, creative projects, photos, what to continue.
8. **Adventure Atlas**: local explorations, day trips, weekend travel, international itineraries, budgets, packing, transit, safety, passport stamps.
9. **Hostess Academy**: gatherings, guests, invitations, budgets, menus, shopping, seating, accessibility, playlists, event-day run of show.
10. **Personal Refinement Studio**: self-chosen style, speaking, communication, hosting, confidence, etiquette, grooming, posture, personal expression.
11. **Community & Contribution Garden**: volunteering, civic participation, mentoring, community groups, giving, hours and impact.
12. **Life Museum**: memories, photographs, tickets, favorite conversations, monthly retrospectives, personal milestones.

## Cross-world Experience Discovery Engine
- Search curated/official event and venue sources with attribution, source URL, verified local date/time, event timezone, location, admission, registration deadline, accessibility, age restrictions and transit.
- Distinguish **verified current event** from **evergreen idea** and **unverified lead**. Never fabricate availability, prices, or links.
- Filters: free/under $20/under $50/custom budget, interest, solo/social, time, neighborhood, transit, energy, accessibility, indoor/outdoor, weather.
- Save → wishlist → plan → calendar → budget reservation → reminders → attendance check-in → notes/photos → Life Museum.
- Respect user approval for signups, purchases, calendar invitations, outreach, and sharing. Avoid repeated notifications and duplicate event records.
- Recommendation mix: familiar comforts + discovery; free alternatives; low-energy alternatives; never assume the user must be social.
- Optional Courage Ladder: opt-in self-chosen social challenges with private reflections, no score or streak punishment.
- Sunday Life Salon: preview coming week; recommend 1–3 meaningful opportunities within time/budget; show social and cultural balance without moral judgment.
- Becoming Her enrichment dashboard: adjustable goals for culture, classes, social outings, first-time experiences, books/lectures, community, hosting, travel, rest and learning. Explicitly NOT a worth score.

## Life Maintenance department
- Documents: IDs, license, passport, taxes, insurance, contracts, warranties, renewal/expiry dates.
- Financial housekeeping: bill reconciliation, savings, debt review, subscriptions, annual credit report, tax preparation, business bookkeeping.
- Home operations: seasonal cleaning, filters, safety checks, inventory, maintenance, repairs, renter/homeowner documentation.
- Preventive healthcare: appointments, prescriptions, screenings, referrals, prep, transportation, follow-up, confidential records.
- Pet care: flea prevention, food/litter stock, vaccinations, vet, grooming, sitter/emergency instructions.
- Transportation: transit planning, lessons, licensing, insurance, registration, car maintenance.
- Digital safety: password manager, 2FA, backup verification, recovery plans, device maintenance.
- Relationships: birthdays, invitations, check-ins, gifts, boundaries.
- Career and studio: applications, interviews, learning, client obligations, compliance, taxes, contract renewals.
- Personal growth: classes, hobbies, creative practice, rest and experiences.
- Seasonal maintenance calendar: weekly/monthly/quarterly/biannual/annual schedules, deduplicated completion, deferrals, snooze, clear provenance.
- Sunday Life Reset: finances, appointments, laundry, pet, groceries, cleaning, social opportunities, goals, transportation, optional weekly approval.

## Clueless Closet expansion
- OOTD preview vs actually worn are separate actions.
- Worn garment care policy configurable by category, label, condition and fabric. Underwear/workout items usually wash after wear; outerwear, trousers, shoes and bags may be rewear/maintenance.
- Item wear counts, rewear limit, stains/odor override, dry-clean-only flags, professional care checks at user-selected 6/12-month or other intervals.
- Laundry basket → wash → dry → put away → clean and available, with individual confirmation; do not mark dry-clean-only garments as machine washed.
- Outfit history with date, occasion, photo, mood, favorite combinations, cost per wear, travel packing, weather and garment availability.
- Optional clothes-care and dry-cleaning budget; local cleaner discovery only when requested.

## Data and architecture
- Typed records: experience, eventSource, classSession, enrollment, outing, cultureVisit, socialPlan, connection, restaurantVisit, learningPath, hobbyTrial, trip, gathering, contribution, memory, maintenanceRule, maintenanceCompletion, wardrobeWear, garmentCare, weeklyReview.
- Each relation uses stable IDs; dates are ISO local dates plus timezone where needed; no ambiguous duplicate event IDs.
- A single agenda derives from saved events + recurring rules + optional discovery recommendations, never inserts endless generated tasks.
- Offline-first private local storage, explicit export/import, optional encrypted or access-controlled sync. Sensitive healthcare, finances, relationships and memories private by default.
- Reuse existing records/routes where possible, migrate schema with tests; avoid breaking existing user data.
- Event discovery needs trusted source integrations, fresh lookup, rate limits, dedupe, provenance, and an unavailable state when lookup cannot verify.
- Test keyboard navigation, screen readers, mobile, timezone rollover, DST, no-network state, data persistence, deletion/restore, recurrence, privacy and notification permissions.

## Delivery phases
A. Stable OOTD lifecycle + maintenance recurring schema and tests.
B. Art of Living domain models, editable records and linked calendar/budget.
C. Discovery source adapters, verification, filters and event-saving flow.
D. Social, classes, culture, dining, hosting and memory UX.
E. Sunday Life Salon, enrichment dashboards, and user-approved suggestions.
F. Browser/mobile end-to-end, accessibility, privacy and recovery audit.
