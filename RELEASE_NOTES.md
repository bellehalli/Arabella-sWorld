# 2.0 review.1

New visual system: lavender/blush editorial typography, original SVG nook illustration, hand-drawn line icons, botanical/silver-heart accents, heart capture button, soft entrances and floating celestial details. Motion can be disabled and respects prefers-reduced-motion. Dark/garden palettes, low-energy and command modes, and a touch-oriented mobile layout are included.

Replaced independent forms with a connected record foundation. Added reliable save errors, drafts, previous writing snapshots, links/backlinks, trash, import previews, exact-cent money math, native task boards, pipelines, 78-card library and local spreads, focus history, habit logs and a small opt-in rule runner.

Validation: 24 automated logic/DOM tests passed before staging packaging. They include seeded route rendering, all editor types, real form submission, stale-draft conflicts, import validation/idempotence, storage failure, cloud adapter success/conflict mocks, exact finances and reflective tarot uniqueness. They are not live browser visual, real database authorization, mobile or full end-to-end tests. Those checks remain required before production.

Deployment target: preview of the existing belle-dreamhub Vercel project. Original production remains unchanged.

## Feature completion update · 2026-10-24

- The current review source contains 46 navigation routes and 74 typed record forms. The current automated suite passes 215/215 tests, including route rendering, editor/privacy behavior, and targeted Career and Finance workflows.
- Career now has application-linked interview preparation, private resume/portfolio version records, source/contact tracking, dated follow-up tasks, and entered-assumption gross compensation comparisons.
- Finance statement CSV review can explicitly reconcile likely matches or import selected unmatched rows. Ambiguous and repeated-in-file rows stay unselected. This remains a manual workflow; no bank is connected.
- Existing care, relationship, pet, experience, library, Grimoire, and Dream Estate workflows are represented in the current source and documented in the feature acceptance regression procedure.
- This is still a development review build. Live bank connections, production security acceptance, real-device visual/accessibility QA, and the broader automation phase are not complete.

## Browser sign-in and world hub · 2026-10-25

- Cloud mode now restores the saved Supabase browser session before rendering. It does not ask for a separate local-vault passphrase or recovery key each time. Device-only mode keeps the encrypted local vault and its unlock flow.
- Cloud records remain in the invited Supabase account. Unsent offline edits wait in this browser until they sync; cloud sync is not end-to-end encrypted. Sign-in is remembered per browser origin, so use the same site address when reopening DreamHub.
- Replaced the long Dream Estate room map with six compact world cards, quick doors, expandable room lists, recent places, and a prominent “Travel my worlds” shortcut. The home opening now shows a short agenda and care shortcut.
